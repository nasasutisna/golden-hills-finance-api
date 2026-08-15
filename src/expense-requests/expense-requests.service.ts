import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { ExpenseRequestsRepository } from './expense-requests.repository';
import { CashTransactionsService } from '../cash-transactions/cash-transactions.service';
import { TransactionCategoriesRepository } from '../transaction-categories/transaction-categories.repository';
import { CreateApprovalHistoryDto, ApprovalAction } from '../approval-histories/dto/create-approval-history.dto';
import {
  CreateExpenseRequestDto,
} from './dto/create-expense-request.dto';
import { ApproveExpenseRequestDto } from './dto/approve-expense-request.dto';
import { RejectExpenseRequestDto } from './dto/reject-expense-request.dto';
import { QueryExpenseRequestDto } from './dto/query-expense-request.dto';
import {
  ExpenseRequestStatus,
  AUTO_APPROVE_ROLES,
  DEFAULT_EXPENSE_CATEGORY_CODE,
  DEFAULT_IPL_EXPENSE_CATEGORY_CODE,
} from './dto/enums';
import { FUND_TYPES, FundType } from '../common/constants/cash-accounts';

@Injectable()
export class ExpenseRequestsService {
  private readonly logger = new Logger(ExpenseRequestsService.name);

  constructor(
    private readonly repository: ExpenseRequestsRepository,
    private readonly prisma: PrismaService,
    private readonly cashTransactionsService: CashTransactionsService,
    private readonly transactionCategoriesRepository: TransactionCategoriesRepository,
  ) {}

  // --------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------
  async create(userId: string, dto: CreateExpenseRequestDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // 1. Fetch user + role + resident link
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          role: { select: { name: true } },
          resident: { select: { id: true } },
        },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const userRole = user.role?.name || '';
      const autoApprove = AUTO_APPROVE_ROLES.includes(userRole);

      // 2. Validate / resolve category + fundType (kept consistent)
      const { categoryId, fundType } = await this.resolveCategoryId(
        dto.categoryId,
        dto.fundType,
        tx,
      );

      // 3. Generate request number + decide status
      const requestNumber = await this.repository.generateRequestNumber(tx);
      const status = autoApprove
        ? ExpenseRequestStatus.APPROVED
        : ExpenseRequestStatus.PENDING;

      // 4. Resolve resident (pengurus) link
      const residentId = dto.residentId || user.resident?.id || null;

      // 5. Create request
      const request = await this.repository.create(
        {
          requestNumber,
          title: dto.title,
          description: dto.description,
          amount: dto.amount,
          categoryId,
          fundType,
          requestedById: userId,
          residentId,
          transactionDate: new Date(dto.transactionDate),
          paymentMethod: dto.paymentMethod,
          status,
          ...(autoApprove
            ? { approvedBy: userId, approvedAt: new Date() }
            : {}),
        },
        tx,
      );

      // 6. Link proof photos (ownership-checked)
      if (dto.fileIds && dto.fileIds.length > 0) {
        const linked = await this.repository.linkFiles(request.id, dto.fileIds, userId, tx);
        if (linked === 0) {
          this.logger.warn(
            `No proof photos linked for request ${request.requestNumber} (fileIds not owned by user or already attached)`,
          );
        }
      }

      // 7. Approval history: CREATED (and SUBMITTED if pending)
      await this.createApprovalHistory(
        {
          entityType: 'ExpenseRequest',
          entityId: request.id,
          action: autoApprove ? ApprovalAction.APPROVED : ApprovalAction.SUBMITTED,
          toStatus: status,
          createdBy: userId,
          ...(autoApprove ? { approvedBy: userId } : {}),
        },
        tx,
      );

      // 8. If auto-approved, post CashTransaction inside the same tx (atomic)
      if (autoApprove) {
        const cashTx = await this.cashTransactionsService.createFromExpenseRequest(
          {
            id: request.id,
            requestNumber: request.requestNumber,
            title: request.title,
            amount: request.amount,
            categoryId: request.categoryId,
            fundType: request.fundType,
            transactionDate: request.transactionDate,
            paymentMethod: request.paymentMethod,
          },
          userId,
          tx,
        );
        await this.repository.update(
          request.id,
          { cashTransactionId: cashTx.id },
          tx,
        );
      }

      this.logger.log(
        `Expense request ${request.requestNumber} created by ${user.username} (status=${status})`,
      );
      return request;
    });
  }

  // --------------------------------------------------------------
  // APPROVE
  // --------------------------------------------------------------
  async approve(id: string, approverId: string, dto: ApproveExpenseRequestDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const request = await tx.expenseRequest.findUnique({ where: { id } });
      if (!request) {
        throw new NotFoundException('Expense request not found');
      }
      if (request.status !== ExpenseRequestStatus.PENDING) {
        throw new BadRequestException(
          `Cannot approve request with status ${request.status}`,
        );
      }

      const updated = await this.repository.update(
        id,
        {
          status: ExpenseRequestStatus.APPROVED,
          approvedBy: approverId,
          approvedAt: new Date(),
        },
        tx,
      );

      // Log approval history
      await this.createApprovalHistory(
        {
          entityType: 'ExpenseRequest',
          entityId: id,
          action: ApprovalAction.APPROVED,
          fromStatus: ExpenseRequestStatus.PENDING,
          toStatus: ExpenseRequestStatus.APPROVED,
          approvedBy: approverId,
          createdBy: approverId,
          comments: dto.comments,
        },
        tx,
      );

      // Post CashTransaction (atomic, inside same tx)
      const cashTx = await this.cashTransactionsService.createFromExpenseRequest(
        {
          id: request.id,
          requestNumber: request.requestNumber,
          title: request.title,
          amount: request.amount,
          categoryId: request.categoryId,
          fundType: request.fundType,
          transactionDate: request.transactionDate,
          paymentMethod: request.paymentMethod,
        },
        approverId,
        tx,
      );
      const finalRequest = await this.repository.update(
        id,
        { cashTransactionId: cashTx.id },
        tx,
      );

      this.logger.log(
        `Expense request ${request.requestNumber} approved by user ${approverId}`,
      );
      return finalRequest;
    });
  }

  // --------------------------------------------------------------
  // REJECT (no CashTransaction posted)
  // --------------------------------------------------------------
  async reject(id: string, approverId: string, dto: RejectExpenseRequestDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const request = await tx.expenseRequest.findUnique({ where: { id } });
      if (!request) {
        throw new NotFoundException('Expense request not found');
      }
      if (request.status !== ExpenseRequestStatus.PENDING) {
        throw new BadRequestException(
          `Cannot reject request with status ${request.status}`,
        );
      }

      const updated = await this.repository.update(
        id,
        {
          status: ExpenseRequestStatus.REJECTED,
          rejectionReason: dto.reason,
        },
        tx,
      );

      await this.createApprovalHistory(
        {
          entityType: 'ExpenseRequest',
          entityId: id,
          action: ApprovalAction.REJECTED,
          fromStatus: ExpenseRequestStatus.PENDING,
          toStatus: ExpenseRequestStatus.REJECTED,
          approvedBy: approverId,
          createdBy: approverId,
          comments: dto.reason,
        },
        tx,
      );

      this.logger.log(
        `Expense request ${request.requestNumber} rejected by user ${approverId}`,
      );
      return updated;
    });
  }

  // --------------------------------------------------------------
  // CANCEL (only owner, only while PENDING)
  // --------------------------------------------------------------
  async cancel(id: string, userId: string) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const request = await tx.expenseRequest.findUnique({ where: { id } });
      if (!request) {
        throw new NotFoundException('Expense request not found');
      }
      if (request.requestedById !== userId) {
        throw new ForbiddenException('You can only cancel your own requests');
      }
      if (request.status !== ExpenseRequestStatus.PENDING) {
        throw new BadRequestException(
          `Cannot cancel request with status ${request.status}`,
        );
      }

      const updated = await this.repository.update(
        id,
        { status: ExpenseRequestStatus.CANCELLED },
        tx,
      );

      await this.createApprovalHistory(
        {
          entityType: 'ExpenseRequest',
          entityId: id,
          action: ApprovalAction.CANCELLED,
          fromStatus: ExpenseRequestStatus.PENDING,
          toStatus: ExpenseRequestStatus.CANCELLED,
          createdBy: userId,
        },
        tx,
      );

      this.logger.log(`Expense request ${request.requestNumber} cancelled by owner`);
      return updated;
    });
  }

  // --------------------------------------------------------------
  // READ
  // --------------------------------------------------------------
  async findAll(query: QueryExpenseRequestDto, additionalWhere?: any) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { requestNumber: { contains: query.search } },
        { title: { contains: query.search } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.fundType) where.fundType = query.fundType;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.requestedById) where.requestedById = query.requestedById;
    if (query.residentId) where.residentId = query.residentId;
    if (query.dateFrom || query.dateTo) {
      where.transactionDate = {};
      if (query.dateFrom) where.transactionDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.transactionDate.lte = new Date(query.dateTo);
    }
    if (additionalWhere) Object.assign(where, additionalWhere);

    const { requests, total } = await this.repository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    // Attach proof photos in one batch query (avoid N+1)
    const filesMap = await this.repository.findFilesByEntityIds(
      requests.map((r: any) => r.id),
    );
    const data = requests.map((r: any) => ({ ...r, files: filesMap[r.id] || [] }));

    const totalPages = Math.ceil(total / limit);
    return {
      data,
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

  async findPending(query: QueryExpenseRequestDto) {
    return this.findAll(query, { status: ExpenseRequestStatus.PENDING });
  }

  async findMyRequests(userId: string, query: QueryExpenseRequestDto) {
    return this.findAll(query, { requestedById: userId });
  }

  async findOne(id: string, userId: string, requireOwnershipForNonStaff = true) {
    const request = await this.repository.findById(id);
    if (!request) {
      throw new NotFoundException('Expense request not found');
    }

    // Ownership check: non-admin/accountant/manager can only see their own
    if (requireOwnershipForNonStaff && request.requestedById !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: { select: { name: true } } },
      });
      const role = user?.role?.name || '';
      if (!['SUPERADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(role)) {
        throw new ForbiddenException('You can only view your own requests');
      }
    }

    return request;
  }

  // --------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------

  /**
   * Resolve the request's categoryId + fundType together so they always agree.
   *
   *  - If categoryId is provided: validate it is an EXPENSE category, then derive
   *    the request's fundType from that category (defaults to WARGA if untagged).
   *  - If categoryId is omitted: pick a default EXPENSE category matching the
   *    requested fundType — WARGA → PENGELUARAN-WARGA, IPL → OPERASIONAL-IPL.
   *
   * The returned fundType is the single source of truth for which Kas the
   * approved expense posts to (see CashTransactionsService.createFromExpenseRequest).
   */
  private async resolveCategoryId(
    categoryId: string | undefined,
    fundType: string | undefined,
    tx?: PrismaTransactionalClient,
  ): Promise<{ categoryId: string | null; fundType: string }> {
    const resolvedFund: string = fundType === FUND_TYPES.IPL ? FUND_TYPES.IPL : FUND_TYPES.WARGA;

    if (categoryId) {
      const category = await this.transactionCategoriesRepository.findById(categoryId);
      if (!category) {
        throw new BadRequestException('Category not found');
      }
      if (category.categoryType !== 'EXPENSE') {
        throw new BadRequestException('Category must be an EXPENSE type');
      }
      // The category's fundType wins so the stored fundType always matches the Kas
      // the category would post to. Default to WARGA if the category is untagged.
      const categoryFund = (category.fundType as FundType | null) || FUND_TYPES.WARGA;
      return { categoryId: category.id, fundType: categoryFund };
    }

    const defaultCode = resolvedFund === FUND_TYPES.IPL
      ? DEFAULT_IPL_EXPENSE_CATEGORY_CODE
      : DEFAULT_EXPENSE_CATEGORY_CODE;
    const defaultCategory = await this.transactionCategoriesRepository.findByCategoryCode(
      defaultCode,
    );
    return { categoryId: defaultCategory?.id ?? null, fundType: resolvedFund };
  }

  /**
   * Write an ApprovalHistory row inside the current transaction.
   * ApprovalHistoriesService.create does not accept a tx, so we call
   * prisma.approvalHistory.create directly (mirrors ipl-payments pattern).
   */
  private async createApprovalHistory(
    dto: CreateApprovalHistoryDto,
    tx?: PrismaTransactionalClient,
  ) {
    const prisma = tx || this.prisma;
    // `fromStatus` exists only on the DTO — the ApprovalHistory table has no
    // such column and Prisma rejects unknown args, so strip both it and the
    // renamed `toStatus`.
    const { toStatus, fromStatus, ...rest } = dto;
    return prisma.approvalHistory.create({
      data: {
        ...rest,
        status: toStatus,
      },
    });
  }
}
