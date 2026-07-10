import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { QueryIplPaymentsDto } from './dto/query-ipl-payments.dto';
import { CreateIplPaymentDto } from './dto/create-ipl-payment.dto';
import { UpdateIplPaymentDto } from './dto/update-ipl-payment.dto';
import { ApproveIplPaymentDto } from './dto/approve-ipl-payment.dto';
import { RejectIplPaymentDto } from './dto/reject-ipl-payment.dto';
import { CreateIplBulkPaymentDto } from './dto/create-ipl-bulk-payment.dto';
import { ApproveIplBulkPaymentDto } from './dto/approve-ipl-bulk-payment.dto';
import { RejectIplBulkPaymentDto } from './dto/reject-ipl-bulk-payment.dto';
import { QueryIplBulkPaymentsDto } from './dto/query-ipl-bulk-payments.dto';
import { IplPaymentStatus, IplBulkPaymentStatus, PaymentMethod } from './dto/enums';
import { IplPaymentsRepository, IplPaymentWithFiles, IplBulkPaymentWithFiles } from './ipl-payments.repository';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { ApprovalHistoriesService } from '../approval-histories/approval-histories.service';
import { CreateApprovalHistoryDto, ApprovalAction } from '../approval-histories/dto/create-approval-history.dto';

@Injectable()
export class IplPaymentsService {
  private readonly logger = new Logger(IplPaymentsService.name);

  constructor(
    private readonly iplPaymentsRepository: IplPaymentsRepository,
    private readonly prisma: PrismaService,
    private readonly approvalHistoriesService: ApprovalHistoriesService,
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
        // Validate coordinator access
        await this.validateCoordinatorAccess(
          userId,
          createIplPaymentDto.residentId,
          tx,
        );
      }

      // 4. Get period details
      const period = await tx.iplPeriod.findUnique({
        where: { id: createIplPaymentDto.periodId },
      });

      if (!period) {
        throw new BadRequestException('Period not found');
      }

      if (period.status !== 'ACTIVE') {
        throw new BadRequestException('Can only create payment for active periods');
      }

      // 5. Get house unit details for calculation
      const houseUnit = await tx.houseUnit.findUnique({
        where: { id: houseUnitId },
      });

      if (!houseUnit) {
        throw new BadRequestException('House unit not found');
      }

      // 6. Calculate IPL amount
      const calculatedAmount = this.calculateIplAmount(
        houseUnit.landArea,
        houseUnit.iplPercentage,
        period.baseRate,
      );

      // 7. Check for duplicate payment
      const existingPayment = await tx.iplPayment.findFirst({
        where: {
          periodId: createIplPaymentDto.periodId,
          residentId: createIplPaymentDto.residentId,
          deletedAt: null,
        },
      });

      if (existingPayment) {
        throw new BadRequestException('Payment for this period and resident already exists');
      }

      // 8. Generate payment number
      const paymentNumber = this.iplPaymentsRepository.generatePaymentNumber();

      // 9. Determine status and approval details based on user role
      let paymentStatus = IplPaymentStatus.PENDING;
      let approvedBy: string | null = null;
      let approvedAt: Date | null = null;
      let approvalAction = ApprovalAction.SUBMITTED;
      let approvalComments = 'Payment submitted by coordinator';

      if (isAdminOrAccountant) {
        // Auto-approve for admin/accountant
        paymentStatus = IplPaymentStatus.APPROVED;
        approvedBy = userId;
        approvedAt = new Date();
        approvalAction = ApprovalAction.APPROVED;
        approvalComments = `Auto-approved payment created by ${userRole.toLowerCase()}`;
      }

      // 10. Create payment
      const payment = await this.iplPaymentsRepository.create(
        {
          paymentNumber,
          periodId: createIplPaymentDto.periodId,
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
        },
        tx,
      );

      // 11. Link file attachment if provided
      if (createIplPaymentDto.proofFileId) {
        await tx.fileAttachment.update({
          where: { id: createIplPaymentDto.proofFileId },
          data: {
            entityType: 'IplPayment',
            entityId: payment.id,
          },
        });
      }

      // 12. Create approval history
      await this.createApprovalHistory(
        {
          entityType: 'IplPayment',
          entityId: payment.id,
          action: approvalAction,
          toStatus: paymentStatus,
          comments: approvalComments,
          createdBy: userId,
          ...(isAdminOrAccountant && { approvedBy: userId }),
        },
        tx,
      );

      // 13. Fetch payment with files for the response (within transaction)
      const files = await tx.fileAttachment.findMany({
        where: {
          entityType: 'IplPayment',
          entityId: payment.id,
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

      const paymentWithFiles = { ...payment, files };

      this.logger.log(`IPL payment created: ${paymentWithFiles!.paymentNumber} by user ${userId} (${userRole}) - Status: ${paymentStatus}`);
      return paymentWithFiles;
    });
  }

  async approve(id: string, approverId: string, dto: ApproveIplPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Validate payment exists and is pending
      const payment = await this.iplPaymentsRepository.findById(id);
      if (payment.status !== IplPaymentStatus.PENDING) {
        throw new BadRequestException('Payment is not in pending status');
      }

      // Update payment status
      const updated = await this.iplPaymentsRepository.update(
        id,
        {
          status: IplPaymentStatus.APPROVED,
          approvedBy: approverId,
          approvedAt: new Date(),
        },
        tx,
      );

      // Create approval history
      await this.createApprovalHistory(
        {
          entityType: 'IplPayment',
          entityId: id,
          action: ApprovalAction.APPROVED,
          fromStatus: IplPaymentStatus.PENDING,
          toStatus: IplPaymentStatus.APPROVED,
          approvedBy: approverId,
          comments: dto.comments || 'Payment approved',
          createdBy: approverId,
        },
        tx,
      );

      this.logger.log(`IPL payment approved: ${payment.paymentNumber}`);
      return updated;
    });
  }

  async reject(id: string, approverId: string, dto: RejectIplPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Validate payment exists and is pending
      const payment = await this.iplPaymentsRepository.findById(id);
      if (payment.status !== IplPaymentStatus.PENDING) {
        throw new BadRequestException('Payment is not in pending status');
      }

      // Update payment status
      const updated = await this.iplPaymentsRepository.update(
        id,
        {
          status: IplPaymentStatus.REJECTED,
          approvedBy: approverId,
          approvedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
        tx,
      );

      // Create approval history
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

      this.logger.log(`IPL payment rejected: ${payment.paymentNumber}`);
      return updated;
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

  // ============================================================
  // BULK PAYMENT METHODS
  // ============================================================

  async createBulkPayment(userId: string, createIplBulkPaymentDto: CreateIplBulkPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
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
        where: { id: createIplBulkPaymentDto.residentId },
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

      // 3. Validate coordinator access only for coordinators
      if (!isAdminOrAccountant) {
        await this.validateCoordinatorAccess(
          userId,
          createIplBulkPaymentDto.residentId,
          tx,
        );
      }

      // 4. Get start period and calculate subsequent periods
      const startPeriod = await tx.iplPeriod.findUnique({
        where: { id: createIplBulkPaymentDto.startPeriodId },
      });

      if (!startPeriod) {
        throw new BadRequestException('Start period not found');
      }

      if (startPeriod.status !== 'ACTIVE') {
        throw new BadRequestException('Start period is not active');
      }

      // 5. Get all periods for bulk payment
      const periodIds: string[] = [];
      const periods: any[] = [];

      for (let i = 0; i < createIplBulkPaymentDto.monthCount; i++) {
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

        periodIds.push(period.id);
        periods.push(period);
      }

      // 6. Check for existing payments
      const existingPeriodIds = await this.iplPaymentsRepository.checkExistingPayments(
        createIplBulkPaymentDto.residentId,
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

      // 7. Calculate total amount
      let totalAmount = 0;
      const paymentData: any[] = [];

      for (const period of periods) {
        const calculatedAmount = this.calculateIplAmount(
          resident.houseUnit!.landArea,
          resident.houseUnit!.iplPercentage,
          period.baseRate,
        );
        totalAmount += parseFloat(calculatedAmount);
        paymentData.push({
          periodId: period.id,
          calculatedAmount,
          baseRate: period.baseRate,
        });
      }

      // 8. Generate bulk payment number
      const bulkNumber = this.iplPaymentsRepository.generateBulkPaymentNumber();

      // 9. Determine status and approval details
      let bulkStatus = IplBulkPaymentStatus.PENDING;
      let paymentStatus = IplPaymentStatus.PENDING;
      let approvedBy: string | null = null;
      let approvedAt: Date | null = null;
      let approvalAction = ApprovalAction.SUBMITTED;
      let approvalComments = 'Bulk payment submitted by coordinator';

      if (isAdminOrAccountant) {
        bulkStatus = IplBulkPaymentStatus.APPROVED;
        paymentStatus = IplPaymentStatus.APPROVED;
        approvedBy = userId;
        approvedAt = new Date();
        approvalAction = ApprovalAction.APPROVED;
        approvalComments = `Auto-approved bulk payment created by ${userRole.toLowerCase()}`;
      }

      // 10. Create bulk payment WITHOUT proofFileId (we'll link it after creation)
      const bulkPayment = await this.iplPaymentsRepository.createBulkPayment(
        {
          bulkNumber,
          residentId: createIplBulkPaymentDto.residentId,
          houseUnitId: resident.houseUnit.id,
          startPeriodId: createIplBulkPaymentDto.startPeriodId,
          monthCount: createIplBulkPaymentDto.monthCount,
          paymentDate: new Date(createIplBulkPaymentDto.paymentDate),
          paymentMethod: createIplBulkPaymentDto.paymentMethod,
          referenceNumber: createIplBulkPaymentDto.referenceNumber,
          notes: createIplBulkPaymentDto.notes,
          totalAmount: totalAmount.toFixed(2),
          status: bulkStatus,
          approvedBy,
          approvedAt,
          submittedBy: userId,
        },
        tx,
      );

      // 11. Link file attachment if provided (update AFTER creation so repository can find it)
      if (createIplBulkPaymentDto.proofFileId) {
        await tx.fileAttachment.update({
          where: { id: createIplBulkPaymentDto.proofFileId },
          data: {
            entityType: 'IplBulkPayment',
            entityId: bulkPayment.id,
          },
        });
      }

      // 12. Fetch files for the response (after linking)
      const files = await tx.fileAttachment.findMany({
        where: {
          entityType: 'IplBulkPayment',
          entityId: bulkPayment.id,
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

      const bulkPaymentWithFiles = { ...bulkPayment, files };

      // 12. Create individual payments
      const payments: IplPaymentWithFiles[] = [];
      for (const data of paymentData) {
        const paymentNumber = this.iplPaymentsRepository.generatePaymentNumber();

        const payment = await this.iplPaymentsRepository.create(
          {
            paymentNumber,
            periodId: data.periodId,
            residentId: createIplBulkPaymentDto.residentId,
            houseUnitId: resident.houseUnit.id,
            paymentDate: new Date(createIplBulkPaymentDto.paymentDate),
            landArea: resident.houseUnit!.landArea,
            iplPercentage: resident.houseUnit!.iplPercentage,
            baseRate: data.baseRate,
            calculatedAmount: data.calculatedAmount,
            paymentMethod: createIplBulkPaymentDto.paymentMethod,
            referenceNumber: createIplBulkPaymentDto.referenceNumber,
            notes: `${createIplBulkPaymentDto.notes || ''} (Bulk: ${bulkNumber})`,
            status: paymentStatus,
            approvedBy,
            approvedAt,
            submittedBy: userId,
            bulkPaymentId: bulkPayment.id,
          },
          tx,
        );

        payments.push(payment);
      }

      // 13. Create approval history for bulk payment
      await this.createApprovalHistory(
        {
          entityType: 'IplBulkPayment',
          entityId: bulkPayment.id,
          action: approvalAction,
          toStatus: bulkStatus,
          comments: approvalComments,
          createdBy: userId,
          ...(isAdminOrAccountant && { approvedBy: userId }),
        },
        tx,
      );

      this.logger.log(
        `Bulk IPL payment created: ${bulkNumber} with ${payments.length} payments by user ${userId} (${userRole}) - Status: ${bulkStatus}`,
      );

      return {
        ...bulkPaymentWithFiles,
        payments,
      };
    });
  }

  async approveBulkPayment(id: string, approverId: string, dto: ApproveIplBulkPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const bulkPayment = await this.iplPaymentsRepository.findBulkPaymentById(id);

      if (bulkPayment.status !== IplBulkPaymentStatus.PENDING) {
        throw new BadRequestException('Bulk payment is not in pending status');
      }

      // Update bulk payment status
      await this.iplPaymentsRepository.updateBulkPayment(
        id,
        {
          status: IplBulkPaymentStatus.APPROVED,
          approvedBy: approverId,
          approvedAt: new Date(),
        },
        tx,
      );

      // Approve all associated payments
      for (const payment of bulkPayment.payments || []) {
        if (payment.status === IplPaymentStatus.PENDING) {
          await this.iplPaymentsRepository.update(
            payment.id,
            {
              status: IplPaymentStatus.APPROVED,
              approvedBy: approverId,
              approvedAt: new Date(),
            },
            tx,
          );

          // Create approval history for individual payment
          await this.createApprovalHistory(
            {
              entityType: 'IplPayment',
              entityId: payment.id,
              action: ApprovalAction.APPROVED,
              fromStatus: IplPaymentStatus.PENDING,
              toStatus: IplPaymentStatus.APPROVED,
              approvedBy: approverId,
              comments: `Approved as part of bulk payment ${bulkPayment.bulkNumber}`,
              createdBy: approverId,
            },
            tx,
          );
        }
      }

      // Create approval history for bulk payment
      await this.createApprovalHistory(
        {
          entityType: 'IplBulkPayment',
          entityId: id,
          action: ApprovalAction.APPROVED,
          fromStatus: IplBulkPaymentStatus.PENDING,
          toStatus: IplBulkPaymentStatus.APPROVED,
          approvedBy: approverId,
          comments: dto.comments || 'Bulk payment approved',
          createdBy: approverId,
        },
        tx,
      );

      this.logger.log(`Bulk IPL payment approved: ${bulkPayment.bulkNumber}`);
      return await this.iplPaymentsRepository.findBulkPaymentById(id);
    });
  }

  async rejectBulkPayment(id: string, approverId: string, dto: RejectIplBulkPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const bulkPayment = await this.iplPaymentsRepository.findBulkPaymentById(id);

      if (bulkPayment.status !== IplBulkPaymentStatus.PENDING) {
        throw new BadRequestException('Bulk payment is not in pending status');
      }

      // Update bulk payment status
      await this.iplPaymentsRepository.updateBulkPayment(
        id,
        {
          status: IplBulkPaymentStatus.REJECTED,
          approvedBy: approverId,
          approvedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
        tx,
      );

      // Reject all associated payments
      for (const payment of bulkPayment.payments || []) {
        if (payment.status === IplPaymentStatus.PENDING) {
          await this.iplPaymentsRepository.update(
            payment.id,
            {
              status: IplPaymentStatus.REJECTED,
              approvedBy: approverId,
              approvedAt: new Date(),
              rejectionReason: dto.rejectionReason,
            },
            tx,
          );

          // Create approval history for individual payment
          await this.createApprovalHistory(
            {
              entityType: 'IplPayment',
              entityId: payment.id,
              action: ApprovalAction.REJECTED,
              fromStatus: IplPaymentStatus.PENDING,
              toStatus: IplPaymentStatus.REJECTED,
              approvedBy: approverId,
              comments: `Rejected as part of bulk payment ${bulkPayment.bulkNumber}`,
              createdBy: approverId,
            },
            tx,
          );
        }
      }

      // Create approval history for bulk payment
      await this.createApprovalHistory(
        {
          entityType: 'IplBulkPayment',
          entityId: id,
          action: ApprovalAction.REJECTED,
          fromStatus: IplBulkPaymentStatus.PENDING,
          toStatus: IplBulkPaymentStatus.REJECTED,
          approvedBy: approverId,
          comments: dto.rejectionReason,
          createdBy: approverId,
        },
        tx,
      );

      this.logger.log(`Bulk IPL payment rejected: ${bulkPayment.bulkNumber}`);
      return await this.iplPaymentsRepository.findBulkPaymentById(id);
    });
  }

  async getBulkPaymentById(id: string) {
    return await this.iplPaymentsRepository.findBulkPaymentById(id);
  }

  async getBulkPayments(queryOptions: QueryIplBulkPaymentsDto, additionalWhere?: any) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, residentId } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (status) {
      where.status = status;
    }

    if (residentId) {
      where.residentId = residentId;
    }

    if (additionalWhere) {
      where = { ...where, ...additionalWhere };
    }

    const { bulkPayments, total } = await this.iplPaymentsRepository.findAllBulkPayments({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: bulkPayments,
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

  async softDeleteBulkPayment(id: string) {
    const bulkPayment = await this.iplPaymentsRepository.softDeleteBulkPayment(id);
    this.logger.log(`Bulk IPL payment soft deleted: ${bulkPayment.bulkNumber}`);
    return bulkPayment;
  }
}
