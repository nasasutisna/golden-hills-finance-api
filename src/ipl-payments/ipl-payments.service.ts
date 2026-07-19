import { Injectable, Logger, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { QueryIplPaymentsDto } from './dto/query-ipl-payments.dto';
import { QueryIplPaymentMatrixDto } from './dto/query-ipl-payment-matrix.dto';
import { CreateIplPaymentDto } from './dto/create-ipl-payment.dto';
import { UpdateIplPaymentDto } from './dto/update-ipl-payment.dto';
import { ApproveIplPaymentDto } from './dto/approve-ipl-payment.dto';
import { RejectIplPaymentDto } from './dto/reject-ipl-payment.dto';
import { IplPaymentStatus, PaymentMethod } from './dto/enums';
import { IplPaymentsRepository, IplPaymentWithFiles } from './ipl-payments.repository';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { ApprovalHistoriesService } from '../approval-histories/approval-histories.service';
import { CreateApprovalHistoryDto, ApprovalAction } from '../approval-histories/dto/create-approval-history.dto';
import { IplReceiptsService } from './ipl-receipts.service';
import { CashTransactionsService } from '../cash-transactions/cash-transactions.service';
import { ResidentPaymentReceiptsService } from '../resident-payments/resident-payment-receipts.service';
import { generateReferenceNumber } from './helpers/reference-number.helper';
import { generateBuktiTransferFilename, sanitizeFilename } from './helpers/file-naming.helper';
import { REFERENCE_TYPES } from '../common/constants/reference-types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class IplPaymentsService {
  private readonly logger = new Logger(IplPaymentsService.name);

  constructor(
    private readonly iplPaymentsRepository: IplPaymentsRepository,
    private readonly prisma: PrismaService,
    private readonly approvalHistoriesService: ApprovalHistoriesService,
    private readonly iplReceiptsService: IplReceiptsService,
    private readonly cashTransactionsService: CashTransactionsService,
    private readonly residentPaymentReceiptsService: ResidentPaymentReceiptsService,
  ) {}

  async findAll(queryOptions: QueryIplPaymentsDto, additionalWhere?: any) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, periodId, residentId, houseUnitId, houseBlockId } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search) {
      where.paymentNumber = { contains: search };
    }

    if (status) {
      where.status = status;
    }

    if (periodId) {
      where.periodId = periodId;
    }

    if (residentId) {
      where.residentId = residentId;
    }

    if (houseUnitId) {
      where.houseUnitId = houseUnitId;
    }

    if (houseBlockId) {
      where.houseUnit = { houseBlockId };
    }

    // Apply additional filters from coordinator validation
    if (additionalWhere) {
      where = { ...where, ...additionalWhere };
    }

    const { payments, total } = await this.iplPaymentsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return await this.iplPaymentsRepository.findById(id);
  }

  async getMyBlockPayments(userId: string, queryOptions: QueryIplPaymentsDto) {
    // Get coordinator's block ID
    const coordinatorBlockId = await this.getCoordinatorBlockId(userId);

    if (!coordinatorBlockId) {
      throw new ForbiddenException('You are not assigned as a coordinator for any block');
    }

    return this.findAll(queryOptions, { houseUnit: { houseBlockId: coordinatorBlockId } });
  }

  async getPendingPayments(queryOptions: QueryIplPaymentsDto) {
    return this.findAll(queryOptions, { status: IplPaymentStatus.PENDING });
  }

  async create(userId: string, createIplPaymentDto: CreateIplPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Determine if this is a multi-month payment
      const monthCount = createIplPaymentDto.monthCount || 1;
      const isMultiMonth = monthCount > 1;
      const paymentGroupId = isMultiMonth ? crypto.randomUUID() : null;

      // 1. GENERATE REFERENCE NUMBER (AUTO)
      const referenceNumber = await generateReferenceNumber(tx);
      this.logger.log(`Generated reference number: ${referenceNumber}`);

      // 2. Get user role to determine if auto-approve is needed
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          roleId: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const userRole = user.role?.name || '';
      const isAdminOrAccountant = ['ADMIN', 'ACCOUNTANT'].includes(userRole);

      // 3. Get resident details to get house unit
      const resident = await tx.resident.findUnique({
        where: { id: createIplPaymentDto.residentId },
        include: {
          houseUnit: true,
        },
      });

      if (!resident) {
        throw new BadRequestException('Resident not found');
      }

      if (!resident.houseUnit) {
        throw new BadRequestException('Resident is not assigned to a house unit');
      }

      let houseUnitId = resident.houseUnit.id;

      // 4. Validate coordinator access only for coordinators (not for admin/accountant)
      if (!isAdminOrAccountant) {
        await this.validateCoordinatorAccess(
          userId,
          createIplPaymentDto.residentId,
          tx,
        );
      }

      // 5. Get start period and calculate subsequent periods if multi-month
      const startPeriod = await tx.iplPeriod.findUnique({
        where: { id: createIplPaymentDto.periodId },
      });

      if (!startPeriod) {
        throw new BadRequestException('Start period not found');
      }

      if (startPeriod.status !== 'ACTIVE') {
        throw new BadRequestException('Can only create payment for active periods');
      }

      // 6. Get all periods for the payment (1 or multiple months)
      const periods: any[] = [];
      const periodIds: string[] = [];

      for (let i = 0; i < monthCount; i++) {
        const targetDate = new Date(startPeriod.year, startPeriod.month - 1 + i, 1);
        const targetMonth = targetDate.getMonth() + 1;
        const targetYear = targetDate.getFullYear();

        const period = await tx.iplPeriod.findFirst({
          where: {
            month: targetMonth,
            year: targetYear,
            status: 'ACTIVE',
            deletedAt: null,
          },
        });

        if (!period) {
          throw new BadRequestException(
            `Period for ${targetMonth}/${targetYear} not found or not active`,
          );
        }

        periods.push(period);
        periodIds.push(period.id);
      }

      // 7. Check for existing payments across all periods
      const existingPeriodIds = await this.iplPaymentsRepository.checkExistingPayments(
        createIplPaymentDto.residentId,
        periodIds,
      );

      if (existingPeriodIds.length > 0) {
        const existingPeriods = await tx.iplPeriod.findMany({
          where: { id: { in: existingPeriodIds } },
          select: { periodName: true },
        });
        const existingNames = existingPeriods.map((p) => p.periodName).join(', ');
        throw new BadRequestException(`Payments already exist for: ${existingNames}`);
      }

      // 8. Get house unit details for calculation
      const houseUnit = await tx.houseUnit.findUnique({
        where: { id: houseUnitId },
      });

      if (!houseUnit) {
        throw new BadRequestException('House unit not found');
      }

      // 9. Determine status and approval details based on user role
      let paymentStatus = IplPaymentStatus.PENDING;
      let approvedBy: string | null = null;
      let approvedAt: Date | null = null;
      let approvalAction = ApprovalAction.SUBMITTED;
      let approvalComments = isMultiMonth
        ? `Multi-month payment (${monthCount} months) submitted by coordinator`
        : 'Payment submitted by coordinator';

      if (isAdminOrAccountant) {
        paymentStatus = IplPaymentStatus.APPROVED;
        approvedBy = userId;
        approvedAt = new Date();
        approvalAction = ApprovalAction.APPROVED;
        approvalComments = isMultiMonth
          ? `Multi-month payment (${monthCount} months) auto-approved by ${userRole.toLowerCase()}`
          : `Auto-approved payment created by ${userRole.toLowerCase()}`;
      }

      // 10. Create payments for each period
      const payments: IplPaymentWithFiles[] = [];
      let totalIplAmount = 0;

      for (const period of periods) {
        const calculatedAmount = this.calculateIplAmount(
          houseUnit.landArea,
          houseUnit.iplPercentage,
          period.baseRate,
        );
        totalIplAmount += parseFloat(calculatedAmount);

        const paymentNumber = this.iplPaymentsRepository.generatePaymentNumber();

        const payment = await this.iplPaymentsRepository.create(
          {
            paymentNumber,
            periodId: period.id,
            residentId: createIplPaymentDto.residentId,
            houseUnitId,
            paymentDate: new Date(createIplPaymentDto.paymentDate),
            landArea: houseUnit.landArea,
            iplPercentage: houseUnit.iplPercentage,
            baseRate: period.baseRate,
            calculatedAmount,
            paymentMethod: createIplPaymentDto.paymentMethod,
            referenceNumber, // Use auto-generated reference number
            notes: createIplPaymentDto.notes,
            status: paymentStatus,
            approvedBy,
            approvedAt,
            submittedBy: userId,
            paymentGroupId,
          },
          tx,
        );

        payments.push(payment);
      }

      // 11. RENAME & LINK FILE ATTACHMENT (if proof file provided)
      let renamedFilePath = null;
      if (createIplPaymentDto.proofFileId && payments.length > 0) {
        const firstPaymentId = payments[0].id;
        const timestamp = Date.now();

        // Get existing file attachment details
        const existingFile = await tx.fileAttachment.findUnique({
          where: { id: createIplPaymentDto.proofFileId },
        });

        if (existingFile) {
          // Generate new filename with reference number
          const originalExt = path.extname(existingFile.fileName);
          const sanitizedUnit = sanitizeFilename(houseUnit.unitNumber);
          const newFileName = generateBuktiTransferFilename(
            startPeriod.month,
            startPeriod.year,
            sanitizedUnit,
            timestamp,
            referenceNumber,
            originalExt,
          );

          // Build new file path
          const unitDir = path.join('./uploads', sanitizedUnit);
          const newFilePath = path.join(unitDir, newFileName);
          const oldFilePath = existingFile.filePath.startsWith('./')
            ? existingFile.filePath
            : `.${existingFile.filePath}`;

          // Ensure directory exists
          if (!fs.existsSync(unitDir)) {
            fs.mkdirSync(unitDir, { recursive: true });
          }

          // Rename/move file if exists
          if (fs.existsSync(oldFilePath)) {
            fs.renameSync(oldFilePath, newFilePath);
            renamedFilePath = newFilePath.replace('./', '/uploads/');
            this.logger.log(`File renamed: ${existingFile.fileName} -> ${newFileName}`);
          }

          // Update file attachment record
          await tx.fileAttachment.update({
            where: { id: createIplPaymentDto.proofFileId },
            data: {
              entityType: 'IplPayment',
              entityId: firstPaymentId,
              fileName: newFileName,
              filePath: renamedFilePath || existingFile.filePath,
            },
          });

          // Fetch and attach files to first payment
          const files = await tx.fileAttachment.findMany({
            where: {
              entityType: 'IplPayment',
              entityId: firstPaymentId,
              deletedAt: null,
            },
            select: {
              id: true,
              fileName: true,
              filePath: true,
              fileSize: true,
              mimeType: true,
              category: true,
              createdAt: true,
            },
          });

          payments[0] = { ...payments[0], files };
        }
      }

      // 12. CREATE KEGIATAN PAYMENT (if provided)
      let kegiatanPayment = null;
      let totalKegiatanAmount = 0;

      if (createIplPaymentDto.kegiatanAmount && createIplPaymentDto.kegiatanAmount > 0) {
        try {
          // Check or get FeeType for "Iuran Kegiatan Warga"
          let feeType = await tx.feeType.findFirst({
            where: {
              feeName: { contains: 'Kegiatan' },
              isActive: true,
              deletedAt: null,
            },
          });

          // If fee type doesn't exist, create it
          if (!feeType) {
            feeType = await tx.feeType.create({
              data: {
                feeCode: 'KEGIATAN',
                feeName: 'Iuran Kegiatan Warga',
                description: 'Iuran untuk kegiatan warga',
                feeCategory: 'SOCIAL',
                isRecurring: true,
                recurrencePeriod: 'MONTHLY',
                isActive: true,
              },
            });
            this.logger.log(`Created FeeType: ${feeType.feeName}`);
          }

          // Check if invoice exists for this resident and period
          const currentMonth = startPeriod.month;
          const currentYear = startPeriod.year;

          let invoice: any = await tx.residentInvoice.findFirst({
            where: {
              residentId: createIplPaymentDto.residentId,
              deletedAt: null,
              details: {
                some: {
                  feeTypeId: feeType.id,
                },
              },
            },
            include: {
              details: true,
            },
            orderBy: {
              invoiceDate: 'desc',
            },
          });

          // If no invoice exists, create one
          if (!invoice) {
            const lastInvoice = await tx.residentInvoice.findFirst({
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              select: { invoiceNumber: true },
            });

            let newInvoiceNumber = 'INV-000001';
            if (lastInvoice?.invoiceNumber) {
              const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
              newInvoiceNumber = `INV-${(lastNum + 1).toString().padStart(6, '0')}`;
            }

            invoice = await tx.residentInvoice.create({
              data: {
                invoiceNumber: newInvoiceNumber,
                residentId: createIplPaymentDto.residentId,
                invoiceDate: new Date(),
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                subtotal: createIplPaymentDto.kegiatanAmount,
                taxAmount: 0,
                discountAmount: 0,
                totalAmount: createIplPaymentDto.kegiatanAmount,
                paidAmount: 0,
                balanceAmount: createIplPaymentDto.kegiatanAmount,
                status: 'PENDING',
                notes: `Iuran kegiatan warga ${currentMonth}/${currentYear}`,
                createdBy: userId,
                details: {
                  create: {
                    feeTypeId: feeType.id,
                    description: `Iuran Kegiatan Warga ${currentMonth}/${currentYear}`,
                    quantity: 1,
                    unitPrice: createIplPaymentDto.kegiatanAmount,
                    taxRate: 0,
                    taxAmount: 0,
                    discountAmount: 0,
                    subtotal: createIplPaymentDto.kegiatanAmount,
                  },
                },
              },
            });
            this.logger.log(`Created invoice: ${invoice.invoiceNumber}`);
          }

          // Safety check - if invoice is still null, skip payment creation
          if (!invoice || !invoice.id) {
            this.logger.warn('Failed to create or retrieve invoice for kegiatan payment');
            return;
          }

          // Create ResidentPayment
          const kegiatanPaymentNumber = `PAY${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

          kegiatanPayment = await tx.residentPayment.create({
            data: {
              paymentNumber: kegiatanPaymentNumber,
              residentId: createIplPaymentDto.residentId,
              invoiceId: invoice.id,
              paymentDate: new Date(createIplPaymentDto.paymentDate),
              amount: createIplPaymentDto.kegiatanAmount,
              paymentMethod: createIplPaymentDto.paymentMethod,
              referenceNumber, // Use same reference number as IPL payment
              notes: `Iuran kegiatan warga ${currentMonth}/${currentYear}`,
              // Auto-verify when submitted by admin/accountant; otherwise awaits IPL approval
              status: isAdminOrAccountant ? 'COMPLETED' : 'PENDING',
              ...(isAdminOrAccountant && { verifiedBy: userId, verifiedAt: new Date() }),
              createdBy: userId,
            },
          });

          // Update invoice paid amount
          const currentPaidAmount = parseFloat(invoice.paidAmount?.toString() || '0');
          const totalAmount = parseFloat(invoice.totalAmount?.toString() || '0');
          const newPaidAmount = currentPaidAmount + createIplPaymentDto.kegiatanAmount;

          await tx.residentInvoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount: newPaidAmount,
              balanceAmount: totalAmount - newPaidAmount,
              status: newPaidAmount >= totalAmount ? 'PAID' : invoice.status,
            },
          });

          totalKegiatanAmount = createIplPaymentDto.kegiatanAmount;
          this.logger.log(`Created kegiatan payment: ${kegiatanPayment.paymentNumber} with ref: ${referenceNumber}`);
        } catch (error) {
          this.logger.error(`Failed to create kegiatan payment: ${error.message}`);
          // Don't fail the entire transaction if kegiatan payment fails
        }
      }

      // 13. Create approval history for the first payment
      await this.createApprovalHistory(
        {
          entityType: 'IplPayment',
          entityId: payments[0].id,
          action: approvalAction,
          toStatus: paymentStatus,
          comments: approvalComments,
          createdBy: userId,
          ...(isAdminOrAccountant && { approvedBy: userId }),
        },
        tx,
      );

      const grandTotal = totalIplAmount + totalKegiatanAmount;
      this.logger.log(
        `IPL payment(s) created: ${monthCount} month(s) + ${totalKegiatanAmount > 0 ? 'Kegiatan payment' : 'no kegiatan'} by user ${userId} (${userRole}) - IPL Total: ${totalIplAmount}, Kegiatan: ${totalKegiatanAmount}, Grand Total: ${grandTotal} - Status: ${paymentStatus}`,
      );

      // 14. Generate receipt for auto-approved payments (outside transaction)
      if (isAdminOrAccountant) {
        setImmediate(async () => {
          try {
            // Create cash transactions for auto-approved payments
            for (const payment of payments) {
              // Fetch full payment details with relations
              const fullPayment = await this.iplPaymentsRepository.findById(payment.id);
              // Create cash transaction for IPL income
              await this.cashTransactionsService.createFromIplPayment(
                fullPayment,
                userId,
              );
            }

            // Also create cash transactions for kegiatan payments if exists
            if (kegiatanPayment) {
              // Fetch full kegiatan payment with resident relation
              const fullKegiatanPayment = await this.prisma.residentPayment.findUnique({
                where: { id: kegiatanPayment.id },
                include: { resident: true },
              });
              if (fullKegiatanPayment) {
                await this.cashTransactionsService.createFromKegiatanPayment(
                  fullKegiatanPayment,
                  userId,
                );

                // Opsi B: generate separate receipt for the iuran kegiatan warga
                await this.residentPaymentReceiptsService.generateReceipt(fullKegiatanPayment.id);
              }
            }

            this.logger.log(`Cash transactions created for auto-approved payment(s): ${payments[0].paymentNumber}`);

            // Generate receipt
            if (isMultiMonth && paymentGroupId) {
              await this.iplReceiptsService.generateReceipt(payments[0].id);
            } else {
              await this.iplReceiptsService.generateReceipt(payments[0].id);
            }
            this.logger.log(`Receipt generated for auto-approved payment(s): ${payments[0].paymentNumber}`);
          } catch (error) {
            this.logger.error(`Failed to process auto-approved payment ${payments[0].paymentNumber}:`, error);
          }
        });
      }

      // Return first payment with group info and kegiatan payment
      const result: any = {
        ...payments[0],
        paymentGroupId: isMultiMonth ? paymentGroupId : null,
      };

      if (isMultiMonth) {
        result._meta = {
          isMultiMonth: true,
          monthCount,
          totalIplAmount,
          totalKegiatanAmount,
          grandTotal,
          allPaymentIds: payments.map((p) => p.id),
        };
      } else {
        result._meta = {
          isMultiMonth: false,
          monthCount: 1,
          totalIplAmount,
          totalKegiatanAmount,
          grandTotal,
        };
      }

      // Include kegiatan payment info if exists
      if (kegiatanPayment) {
        result.kegiatanPayment = {
          id: kegiatanPayment.id,
          paymentNumber: kegiatanPayment.paymentNumber,
          amount: kegiatanPayment.amount,
          invoiceId: kegiatanPayment.invoiceId,
          referenceNumber: kegiatanPayment.referenceNumber,
        };
      }

      return result;
    });
  }

  async approve(id: string, approverId: string, dto: ApproveIplPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Get payment to check if it's part of a group
      const payment = await this.iplPaymentsRepository.findById(id);

      if (payment.status !== IplPaymentStatus.PENDING) {
        throw new BadRequestException('Payment is not in pending status');
      }

      // Check if this payment is part of a multi-month payment group
      const isMultiMonth = !!payment.paymentGroupId;
      let paymentsToUpdate: string[] = [id];

      if (isMultiMonth && payment.paymentGroupId) {
        // Get all pending payments in the same group
        const groupPayments = await tx.iplPayment.findMany({
          where: {
            paymentGroupId: payment.paymentGroupId,
            status: IplPaymentStatus.PENDING,
            deletedAt: null,
          },
          select: { id: true },
        });
        paymentsToUpdate = groupPayments.map((p) => p.id);
      }

      // Update all payments in the group (or just the single payment)
      for (const paymentId of paymentsToUpdate) {
        await this.iplPaymentsRepository.update(
          paymentId,
          {
            status: IplPaymentStatus.APPROVED,
            approvedBy: approverId,
            approvedAt: new Date(),
          },
          tx,
        );
      }

      // Create approval history for the primary payment
      await this.createApprovalHistory(
        {
          entityType: 'IplPayment',
          entityId: id,
          action: ApprovalAction.APPROVED,
          fromStatus: IplPaymentStatus.PENDING,
          toStatus: IplPaymentStatus.APPROVED,
          approvedBy: approverId,
          comments: dto.comments || (isMultiMonth ? `Multi-month payment group approved` : 'Payment approved'),
          createdBy: approverId,
        },
        tx,
      );

      this.logger.log(
        `IPL payment(s) approved: ${payment.paymentNumber} ${isMultiMonth ? `(+ ${paymentsToUpdate.length - 1} others in group)` : ''}`,
      );

      // Create cash transactions for approved payments (outside transaction, after commit)
      setImmediate(async () => {
        try {
          for (const paymentId of paymentsToUpdate) {
            const approvedPayment = await this.iplPaymentsRepository.findById(paymentId);
            // Create cash transaction for IPL income
            await this.cashTransactionsService.createFromIplPayment(
              approvedPayment,
              approverId,
            );

            // Also create cash transaction for kegiatan payment if exists
            // Kegiatan payments have the same referenceNumber as the IPL payment
            const kegiatanPayments = await this.prisma.residentPayment.findMany({
              where: {
                referenceNumber: approvedPayment.referenceNumber,
                deletedAt: null,
              },
              include: {
                resident: true,
              },
            });

            for (const kegiatanPayment of kegiatanPayments) {
              // Mark the kegiatan payment completed (it was created PENDING by a coordinator)
              await this.prisma.residentPayment.update({
                where: { id: kegiatanPayment.id },
                data: {
                  status: 'COMPLETED',
                  verifiedBy: approverId,
                  verifiedAt: new Date(),
                },
              });

              await this.cashTransactionsService.createFromKegiatanPayment(
                kegiatanPayment,
                approverId,
              );

              // Opsi B: generate separate receipt for the iuran kegiatan warga
              await this.residentPaymentReceiptsService.generateReceipt(kegiatanPayment.id);
            }
          }
          this.logger.log(`Cash transactions created for IPL and kegiatan payments: ${payment.paymentNumber}`);
        } catch (error) {
          this.logger.error(`Failed to create cash transactions for payment ${payment.paymentNumber}:`, error);
        }
      });

      // Generate receipt (outside transaction, after commit)
      setImmediate(async () => {
        try {
          await this.iplReceiptsService.generateReceipt(id);
          this.logger.log(`Receipt generated for payment: ${payment.paymentNumber}`);
        } catch (error) {
          this.logger.error(`Failed to generate receipt for payment ${payment.paymentNumber}:`, error);
        }
      });

      // Return updated payment
      return await this.iplPaymentsRepository.findById(id);
    });
  }

  async reject(id: string, approverId: string, dto: RejectIplPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Get payment to check if it's part of a group
      const payment = await this.iplPaymentsRepository.findById(id);

      if (payment.status !== IplPaymentStatus.PENDING) {
        throw new BadRequestException('Payment is not in pending status');
      }

      // Check if this payment is part of a multi-month payment group
      const isMultiMonth = !!payment.paymentGroupId;
      let paymentsToUpdate: string[] = [id];

      if (isMultiMonth && payment.paymentGroupId) {
        // Get all pending payments in the same group
        const groupPayments = await tx.iplPayment.findMany({
          where: {
            paymentGroupId: payment.paymentGroupId,
            status: IplPaymentStatus.PENDING,
            deletedAt: null,
          },
          select: { id: true },
        });
        paymentsToUpdate = groupPayments.map((p) => p.id);
      }

      // Update all payments in the group (or just the single payment)
      for (const paymentId of paymentsToUpdate) {
        await this.iplPaymentsRepository.update(
          paymentId,
          {
            status: IplPaymentStatus.REJECTED,
            approvedBy: approverId,
            approvedAt: new Date(),
            rejectionReason: dto.rejectionReason,
          },
          tx,
        );
      }

      // Create approval history for the primary payment
      await this.createApprovalHistory(
        {
          entityType: 'IplPayment',
          entityId: id,
          action: ApprovalAction.REJECTED,
          fromStatus: IplPaymentStatus.PENDING,
          toStatus: IplPaymentStatus.REJECTED,
          approvedBy: approverId,
          comments: dto.rejectionReason,
          createdBy: approverId,
        },
        tx,
      );

      this.logger.log(
        `IPL payment(s) rejected: ${payment.paymentNumber} ${isMultiMonth ? `(+ ${paymentsToUpdate.length - 1} others in group)` : ''}`,
      );

      // Return updated payment
      return await this.iplPaymentsRepository.findById(id);
    });
  }

  async update(id: string, updateIplPaymentDto: UpdateIplPaymentDto) {
    try {
      const payment = await this.iplPaymentsRepository.update(id, updateIplPaymentDto);
      this.logger.log(`IPL payment updated: ${payment.paymentNumber}`);
      return payment;
    } catch (error) {
      this.logger.error('Error updating IPL payment:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const payment = await this.iplPaymentsRepository.softDelete(id);
    this.logger.log(`IPL payment soft deleted: ${payment.paymentNumber}`);
    return payment;
  }

  async getPaymentStatistics(periodId?: string) {
    return await this.iplPaymentsRepository.getPaymentStatistics(periodId);
  }

  async count(where?: any): Promise<number> {
    return await this.iplPaymentsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.iplPaymentsRepository.exists(id);
  }

  /**
   * Get all payments by reference number (IPL + Kegiatan)
   * Returns grouped payment information for a single transfer
   */
  async getByReferenceNumber(referenceNumber: string) {
    const iplPayments = await this.iplPaymentsRepository.findByReferenceNumber(referenceNumber);

    // Get ResidentPayments with the same reference number
    const residentPayments = await this.prisma.residentPayment.findMany({
      where: {
        referenceNumber,
        deletedAt: null,
      },
      include: {
        resident: {
          select: {
            id: true,
            residentCode: true,
            firstName: true,
            lastName: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: { paymentDate: 'asc' },
    });

    // Calculate totals
    const totalIpl = iplPayments.reduce(
      (sum, p) => sum + parseFloat(p.calculatedAmount?.toString() || '0'),
      0,
    );
    const totalKegiatan = residentPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount?.toString() || '0'),
      0,
    );

    // Get bukti transfer file (from first IPL payment if exists)
    let buktiTransferFile = null;
    if (iplPayments.length > 0) {
      const firstPayment = iplPayments[0];
      if (firstPayment.files && firstPayment.files.length > 0) {
        const buktiFile = firstPayment.files.find((f) => f.category === 'PROOF' || f.category === null);
        if (buktiFile) {
          buktiTransferFile = {
            id: buktiFile.id,
            fileName: buktiFile.fileName,
            filePath: buktiFile.filePath,
            fileSize: buktiFile.fileSize,
            mimeType: buktiFile.mimeType,
          };
        }
      }
    }

    return {
      referenceNumber,
      buktiTransfer: buktiTransferFile,
      iplPayments: iplPayments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        period: p.period?.periodName || '-',
        amount: parseFloat(p.calculatedAmount?.toString() || '0'),
        status: p.status,
        paymentDate: p.paymentDate,
      })),
      kegiatanPayments: residentPayments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        invoiceNumber: p.invoice?.invoiceNumber || '-',
        amount: parseFloat(p.amount?.toString() || '0'),
        paymentDate: p.paymentDate,
      })),
      summary: {
        totalIpl,
        totalKegiatan,
        grandTotal: totalIpl + totalKegiatan,
        paymentCount: iplPayments.length + residentPayments.length,
      },
    };
  }

  // Private helper methods

  private calculateIplAmount(landArea: any, iplPercentage: any, baseRate: any = 2500): string {
    // Formula: landArea * baseRate * (iplPercentage / 100)
    // Convert all to number for calculation
    // Prisma Decimal can be an object with toString() or a number/string
    let landAreaNum: number;
    let iplPercentageNum: number;
    let baseRateNum: number;

    // Handle Prisma Decimal type or other types
    if (typeof landArea === 'object' && landArea !== null) {
      landAreaNum = parseFloat(String(landArea));
    } else if (typeof landArea === 'string') {
      landAreaNum = parseFloat(landArea);
    } else {
      landAreaNum = Number(landArea);
    }

    if (typeof iplPercentage === 'object' && iplPercentage !== null) {
      iplPercentageNum = parseFloat(String(iplPercentage));
    } else if (typeof iplPercentage === 'string') {
      iplPercentageNum = parseFloat(iplPercentage);
    } else {
      iplPercentageNum = Number(iplPercentage);
    }

    if (typeof baseRate === 'object' && baseRate !== null) {
      baseRateNum = parseFloat(String(baseRate));
    } else if (typeof baseRate === 'string') {
      baseRateNum = parseFloat(baseRate);
    } else {
      baseRateNum = Number(baseRate);
    }

    const percentageFactor = iplPercentageNum / 100;
    const result = landAreaNum * baseRateNum * percentageFactor;

    // Return as string with 2 decimal places (for Prisma Decimal)
    return result.toFixed(2);
  }

  private async validateCoordinatorAccess(
    userId: string,
    residentId: string,
    tx?: PrismaTransactionalClient,
  ): Promise<{ houseBlockId: string; houseUnitId: string }> {
    const prisma = tx || this.prisma;

    // Get current user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Find resident that matches this user (by firstName and lastName)
    // This assumes the user account is linked to a resident with matching name
    const coordinatorResident = await prisma.resident.findFirst({
      where: {
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!coordinatorResident?.id) {
      throw new ForbiddenException('User is not linked to a resident profile');
    }

    // Get resident with house unit and block
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        houseUnit: {
          include: { houseBlock: true },
        },
      },
    });

    if (!resident) {
      throw new BadRequestException('Resident not found');
    }

    if (!resident.houseUnit) {
      throw new BadRequestException('Resident is not assigned to a house unit');
    }

    // Validate coordinator is assigned to this block
    const block = await prisma.houseBlock.findFirst({
      where: {
        id: resident.houseUnit.houseBlockId,
        coordinatorId: coordinatorResident.id,
        deletedAt: null,
      },
    });

    if (!block) {
      throw new ForbiddenException('You are not authorized to submit payments for this resident');
    }

    return {
      houseBlockId: block.id,
      houseUnitId: resident.houseUnit.id,
    };
  }

  private async getCoordinatorBlockId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Find resident that matches this user
    const coordinatorResident = await this.prisma.resident.findFirst({
      where: {
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!coordinatorResident?.id) {
      return null;
    }

    const block = await this.prisma.houseBlock.findFirst({
      where: {
        coordinatorId: coordinatorResident.id,
        deletedAt: null,
      },
    });

    return block?.id || null;
  }

  private async createApprovalHistory(
    createApprovalHistoryDto: CreateApprovalHistoryDto,
    tx?: PrismaTransactionalClient,
  ) {
    // Use the approval histories service, but we need to handle transaction
    // Since ApprovalHistoriesService doesn't support transaction directly,
    // we'll create it manually here
    const prisma = tx || this.prisma;

    // Map toStatus to status field for database
    const { toStatus, ...rest } = createApprovalHistoryDto;
    return prisma.approvalHistory.create({
      data: {
        ...rest,
        status: toStatus, // Map toStatus to status field
      },
    });
  }

  /**
   * Build the read-only house-unit x month payment matrix for a year.
   * Composes periods + units + payments from the repository into the matrix
   * shape the frontend renders directly (no further client-side join).
   */
  async getMatrix(query: QueryIplPaymentMatrixDto) {
    const year = query.year ?? new Date().getFullYear();
    const { periods, units, payments } = await this.iplPaymentsRepository.getMatrixData(
      year,
      query.houseBlockId,
    );

    const MONTH_NAMES_SHORT = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    const toNum = (v: any): number => {
      if (v == null) return 0;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    // month -> period
    const periodByMonth = new Map<number, any>();
    for (const p of periods) periodByMonth.set(p.month, p);

    // Base rate fallback for the monthly-rate estimate (earliest period).
    const baseRate = toNum(periods[0]?.baseRate);

    const rankStatus = (s: string): number =>
      s === 'APPROVED' ? 3 : s === 'PENDING' ? 2 : s === 'REJECTED' ? 1 : 0;

    // paymentMap: houseUnitId -> periodId -> best-status payment
    const paymentMap = new Map<string, Map<string, any>>();
    for (const pm of payments) {
      if (!pm.houseUnitId || !pm.periodId) continue;
      let perUnit = paymentMap.get(pm.houseUnitId);
      if (!perUnit) {
        perUnit = new Map<string, any>();
        paymentMap.set(pm.houseUnitId, perUnit);
      }
      const existing = perUnit.get(pm.periodId);
      if (!existing || rankStatus(pm.status) > rankStatus(existing.status)) {
        perUnit.set(pm.periodId, pm);
      }
    }

    const monthTotals: number[] = new Array(12).fill(0);
    let paidCellCount = 0;

    // Stable, readable order: block code then numeric unit number.
    const sortedUnits = [...units].sort((a: any, b: any) => {
      const ba = a.houseBlock?.blockCode ?? '';
      const bb = b.houseBlock?.blockCode ?? '';
      if (ba !== bb) return ba.localeCompare(bb);
      return (a.unitNumber ?? '').localeCompare(b.unitNumber ?? '', undefined, { numeric: true });
    });

    const rows = sortedUnits.map((unit: any, index: number) => {
      const perUnit = paymentMap.get(unit.id);
      const iplPercentage = toNum(unit.iplPercentage ?? 100);
      let paidCount = 0;
      let pendingCount = 0;

      const cells: any[] = MONTH_NAMES_SHORT.map((monthName, i) => {
        const month = i + 1;
        const period = periodByMonth.get(month);
        const pm = period ? perUnit?.get(period.id) : undefined;
        const paymentId = pm?.id ?? null;
        let status: 'PAID' | 'PENDING' | 'UNPAID' = 'UNPAID';
        if (pm) {
          if (pm.status === 'APPROVED') status = 'PAID';
          else if (pm.status === 'PENDING') status = 'PENDING';
        }

        if (status === 'PAID') {
          paidCount++;
          const amount = toNum(pm?.calculatedAmount);
          monthTotals[i] += amount;
          return { month, monthName, periodId: period?.id ?? null, status, amount, paymentId };
        }
        if (status === 'PENDING') pendingCount++;
        return { month, monthName, periodId: period?.id ?? null, status, paymentId };
      });

      // Prefer the unit's real paid amount; fall back to the official formula
      // landArea x baseRate x iplPercentage/100 (see calculateIplAmount).
      const firstPaidAmount = cells.find((c) => c.status === 'PAID')?.amount;
      const monthlyRate =
        firstPaidAmount ?? Math.round(toNum(unit.landArea) * baseRate * (iplPercentage / 100));

      const resident = unit.residents?.[0];
      const residentName = resident
        ? [resident.firstName, resident.lastName].filter(Boolean).join(' ').trim() || null
        : null;

      const noteParts: string[] = [];
      if (unit.isBankBuyback) noteParts.push('Rumah bank/buyback');
      if (unit.occupancyNotes) noteParts.push(unit.occupancyNotes);

      const obligationLabel =
        iplPercentage >= 100 ? 'FULL' : iplPercentage <= 0 ? '0%' : `SETENGAH (${iplPercentage}%)`;

      return {
        no: index + 1,
        unitId: unit.id,
        unitCode: unit.unitCode,
        unitNumber: unit.unitNumber,
        blockCode: unit.houseBlock?.blockCode ?? null,
        blockName: unit.houseBlock?.blockName ?? null,
        landArea: toNum(unit.landArea),
        buildingArea: toNum(unit.buildingArea),
        residentId: resident?.id ?? null,
        residentName,
        phoneNumber: resident?.phoneNumber ?? null,
        iplPercentage,
        obligationLabel,
        notes: noteParts.length ? noteParts.join(' · ') : null,
        monthlyRate,
        isActive: unit.isActive,
        cells,
        paidCount,
        pendingCount,
      };
    });

    paidCellCount = rows.reduce((sum, r) => sum + r.paidCount, 0);
    const grandTotal = monthTotals.reduce((sum, v) => sum + v, 0);

    return {
      year,
      unitCount: rows.length,
      paidCellCount,
      grandTotal,
      monthTotals,
      rows,
    };
  }
}
