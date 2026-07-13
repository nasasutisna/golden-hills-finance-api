import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { QueryIplPaymentsDto } from './dto/query-ipl-payments.dto';
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

@Injectable()
export class IplPaymentsService {
  private readonly logger = new Logger(IplPaymentsService.name);

  constructor(
    private readonly iplPaymentsRepository: IplPaymentsRepository,
    private readonly prisma: PrismaService,
    private readonly approvalHistoriesService: ApprovalHistoriesService,
    private readonly iplReceiptsService: IplReceiptsService,
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

      // 1. Get user role to determine if auto-approve is needed
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

      // 2. Get resident details to get house unit
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

      // 3. Validate coordinator access only for coordinators (not for admin/accountant)
      if (!isAdminOrAccountant) {
        await this.validateCoordinatorAccess(
          userId,
          createIplPaymentDto.residentId,
          tx,
        );
      }

      // 4. Get start period and calculate subsequent periods if multi-month
      const startPeriod = await tx.iplPeriod.findUnique({
        where: { id: createIplPaymentDto.periodId },
      });

      if (!startPeriod) {
        throw new BadRequestException('Start period not found');
      }

      if (startPeriod.status !== 'ACTIVE') {
        throw new BadRequestException('Can only create payment for active periods');
      }

      // 5. Get all periods for the payment (1 or multiple months)
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

      // 6. Check for existing payments across all periods
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

      // 7. Get house unit details for calculation
      const houseUnit = await tx.houseUnit.findUnique({
        where: { id: houseUnitId },
      });

      if (!houseUnit) {
        throw new BadRequestException('House unit not found');
      }

      // 8. Determine status and approval details based on user role
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

      // 9. Create payments for each period
      const payments: IplPaymentWithFiles[] = [];
      let totalAmount = 0;

      for (const period of periods) {
        const calculatedAmount = this.calculateIplAmount(
          houseUnit.landArea,
          houseUnit.iplPercentage,
          period.baseRate,
        );
        totalAmount += parseFloat(calculatedAmount);

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
            referenceNumber: createIplPaymentDto.referenceNumber,
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

      // 10. Link file attachment to first payment if provided
      if (createIplPaymentDto.proofFileId && payments.length > 0) {
        const firstPaymentId = payments[0].id;
        await tx.fileAttachment.update({
          where: { id: createIplPaymentDto.proofFileId },
          data: {
            entityType: 'IplPayment',
            entityId: firstPaymentId,
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

      // 11. Create approval history for the first payment (or the only payment)
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

      this.logger.log(
        `IPL payment(s) created: ${monthCount} month(s) by user ${userId} (${userRole}) - Total: ${totalAmount} - Status: ${paymentStatus}`,
      );

      // 12. Generate receipt for auto-approved payments (outside transaction)
      if (isAdminOrAccountant) {
        setImmediate(async () => {
          try {
            if (isMultiMonth && paymentGroupId) {
              // For multi-month, generate receipt for the first payment
              await this.iplReceiptsService.generateReceipt(payments[0].id);
            } else {
              await this.iplReceiptsService.generateReceipt(payments[0].id);
            }
            this.logger.log(`Receipt generated for auto-approved payment(s): ${payments[0].paymentNumber}`);
          } catch (error) {
            this.logger.error(`Failed to generate receipt for payment ${payments[0].paymentNumber}:`, error);
          }
        });
      }

      // Return first payment with group info if multi-month
      if (isMultiMonth) {
        return {
          ...payments[0],
          paymentGroupId,
          _meta: {
            isMultiMonth: true,
            monthCount,
            totalAmount,
            allPaymentIds: payments.map((p) => p.id),
          },
        };
      }

      return payments[0];
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
}
