import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import { CashTransactionsRepository } from './cash-transactions.repository';
import { TransactionCategoriesRepository } from '../transaction-categories/transaction-categories.repository';
import { ApprovalHistoriesService } from '../approval-histories/approval-histories.service';
import { ApprovalAction } from '../approval-histories/dto/create-approval-history.dto';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
import { REFERENCE_TYPES } from '../common/constants/reference-types';
import { buildReportWorkbook } from './cash-transactions.export';

@Injectable()
export class CashTransactionsService {
  private readonly logger = new Logger(CashTransactionsService.name);

  constructor(
    private readonly cashTransactionsRepository: CashTransactionsRepository,
    private readonly transactionCategoriesRepository: TransactionCategoriesRepository,
    private readonly approvalHistoriesService: ApprovalHistoriesService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    queryOptions: QueryOptionsDto,
    startDate?: string,
    endDate?: string,
    categoryId?: string,
  ) {
    const { page = 1, limit = 10, sortBy = 'transactionDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    // Filter by category if provided
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search },
      }));
    }

    if (filters) {
      where = { ...where, ...filters };
    }

    const { transactions, total } = await this.cashTransactionsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: transactions,
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
    return await this.cashTransactionsRepository.findById(id);
  }

  async create(createCashTransactionDto: CreateCashTransactionDto, user: CurrentUserData) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Generate transaction number
      const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber(
        createCashTransactionDto.transactionType,
      );

      // Create transaction
      const transaction = await this.cashTransactionsRepository.create(
        {
          ...createCashTransactionDto,
          transactionNumber,
          createdBy: user.id,
          status: createCashTransactionDto.requiresApproval ? 'PENDING' : 'APPROVED',
        },
        tx as any,
      );

      // Create approval history
      await this.approvalHistoriesService.create({
        entityType: 'CashTransaction',
        entityId: transaction.id,
        action: ApprovalAction.CREATED,
        toStatus: transaction.status,
        createdBy: user.id,
        ipAddress: createCashTransactionDto.ipAddress,
        userAgent: createCashTransactionDto.userAgent,
      });

      this.logger.log(`Cash transaction created: ${transaction.transactionNumber}`);
      return transaction;
    });
  }

  /**
   * Create an EXPENSE CashTransaction from an approved ExpenseRequest.
   * Designed to be called INSIDE the caller's transaction (tx-aware) to keep the
   * approval + ledger post atomic. Mirrors createFromIplPayment but for EXPENSE.
   * Additive only — does not affect existing flows.
   */
  async createFromExpenseRequest(
    request: {
      id: string;
      requestNumber: string;
      title: string;
      amount: any;
      categoryId?: string | null;
      transactionDate: Date;
      paymentMethod?: string | null;
    },
    approvedBy: string,
    tx?: PrismaTransactionalClient,
  ) {
    // Resolve category: use the request's category, else default to PENGELUARAN-WARGA
    let categoryId = request.categoryId;
    if (!categoryId) {
      const defaultCategory =
        await this.transactionCategoriesRepository.findByCategoryCode('PENGELUARAN-WARGA');
      if (!defaultCategory) {
        throw new BadRequestException(
          "Default expense category 'PENGELUARAN-WARGA' not found. Please seed it.",
        );
      }
      categoryId = defaultCategory.id;
    }

    const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber(
      'EXPENSE',
    );

    const description = `Pengeluaran ${request.requestNumber} - ${request.title}`;

    const cashTx = await this.cashTransactionsRepository.create(
      {
        transactionNumber,
        transactionDate: request.transactionDate,
        transactionType: 'EXPENSE',
        amount: request.amount,
        categoryId,
        description,
        referenceType: REFERENCE_TYPES.EXPENSE_REQUEST,
        referenceId: request.id,
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        createdBy: approvedBy,
      } as any,
      tx,
    );

    this.logger.log(
      `Cash transaction ${cashTx.transactionNumber} created from expense request ${request.requestNumber}`,
    );
    return cashTx;
  }

  async approveTransaction(id: string, user: CurrentUserData) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const transaction = await this.cashTransactionsRepository.findById(id);

      if (transaction.status === 'APPROVED') {
        throw new ConflictException('Transaction already approved');
      }

      if (transaction.status === 'REJECTED') {
        throw new ConflictException('Cannot approve rejected transaction');
      }

      // Update transaction status
      const approvedTransaction = await this.cashTransactionsRepository.updateApprovalStatus(
        id,
        'APPROVED',
        user.id,
        tx as any,
      );

      // Create approval history
      await this.approvalHistoriesService.create({
        entityType: 'CashTransaction',
        entityId: transaction.id,
        action: ApprovalAction.APPROVED,
        fromStatus: transaction.status,
        toStatus: 'APPROVED',
        approvedBy: user.id,
        createdBy: user.id,
      });

      this.logger.log(`Cash transaction approved: ${approvedTransaction.transactionNumber}`);
      return approvedTransaction;
    });
  }

  async rejectTransaction(id: string, reason: string, user: CurrentUserData) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const transaction = await this.cashTransactionsRepository.findById(id);

      if (transaction.status === 'APPROVED') {
        throw new ConflictException('Cannot reject approved transaction');
      }

      if (transaction.status === 'REJECTED') {
        throw new ConflictException('Transaction already rejected');
      }

      // Update transaction status
      const rejectedTransaction = await this.cashTransactionsRepository.updateApprovalStatus(
        id,
        'REJECTED',
        user.id,
        tx as any,
      );

      // Create approval history
      await this.approvalHistoriesService.create({
        entityType: 'CashTransaction',
        entityId: transaction.id,
        action: ApprovalAction.REJECTED,
        fromStatus: transaction.status,
        toStatus: 'REJECTED',
        comments: reason,
        approvedBy: user.id,
        createdBy: user.id,
      });

      this.logger.log(`Cash transaction rejected: ${rejectedTransaction.transactionNumber}`);
      return rejectedTransaction;
    });
  }

  async update(id: string, updateCashTransactionDto: UpdateCashTransactionDto) {
    try {
      const transaction = await this.cashTransactionsRepository.update(id, updateCashTransactionDto);
      this.logger.log(`Cash transaction updated: ${transaction.transactionNumber}`);
      return transaction;
    } catch (error) {
      this.logger.error('Error updating cash transaction:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const transaction = await this.cashTransactionsRepository.softDelete(id);
    this.logger.log(`Cash transaction soft deleted: ${transaction.transactionNumber}`);
    return transaction;
  }

  async getByType(transactionType: string) {
    return await this.cashTransactionsRepository.getByType(transactionType);
  }

  async getByCategory(categoryId: string) {
    return await this.cashTransactionsRepository.getByCategory(categoryId);
  }

  async getByDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await this.cashTransactionsRepository.getByDateRange(start, end);
  }

  async getByApprovalStatus(status: string) {
    return await this.cashTransactionsRepository.getByApprovalStatus(status);
  }

  async getTransactionStatistics(startDate?: string, endDate?: string, categoryId?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.cashTransactionsRepository.getTransactionStatistics(start, end, categoryId);
  }

  async count(where?: any): Promise<number> {
    return await this.cashTransactionsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.cashTransactionsRepository.exists(id);
  }

  /**
   * Create cash transaction from approved IPL payment
   * Called automatically when IPL payment is approved
   */
  async createFromIplPayment(iplPayment: any, approvedBy: string): Promise<any> {
    try {
      // Find IPL income category
      const category = await this.transactionCategoriesRepository.findByCategoryCode('IPL-MASUK');
      if (!category) {
        this.logger.warn('IPL-MASUK category not found, skipping cash transaction creation');
        return null;
      }

      // Generate transaction number
      const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber('INCOME');

      // Create cash transaction
      const transaction = await this.cashTransactionsRepository.create({
        transactionNumber,
        transactionDate: iplPayment.paymentDate,
        transactionType: 'INCOME',
        amount: iplPayment.calculatedAmount,
        categoryId: category.id,
        description: `IPL Payment ${iplPayment.paymentNumber} - ${iplPayment.resident?.firstName || ''} ${iplPayment.resident?.lastName || ''} (Ref: ${iplPayment.referenceNumber})`,
        referenceType: REFERENCE_TYPES.IPL_PAYMENT,
        referenceId: iplPayment.id,
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        createdBy: approvedBy,
      });

      this.logger.log(`Cash transaction created from IPL payment: ${transactionNumber}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create cash transaction from IPL payment:`, error);
      throw error;
    }
  }

  /**
   * Create cash transaction from kegiatan (community activity) payment
   * Called automatically when kegiatan payment is created
   */
  async createFromKegiatanPayment(residentPayment: any, approvedBy: string): Promise<any> {
    try {
      // Find kegiatan income category
      const category = await this.transactionCategoriesRepository.findByCategoryCode('KEGIATAN-MASUK');
      if (!category) {
        this.logger.warn('KEGIATAN-MASUK category not found, skipping cash transaction creation');
        return null;
      }

      // Generate transaction number
      const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber('INCOME');

      // Create cash transaction
      const transaction = await this.cashTransactionsRepository.create({
        transactionNumber,
        transactionDate: residentPayment.paymentDate,
        transactionType: 'INCOME',
        amount: residentPayment.amount,
        categoryId: category.id,
        description: `Iuran Kegiatan Warga - ${residentPayment.resident?.firstName || ''} ${residentPayment.resident?.lastName || ''} (Ref: ${residentPayment.referenceNumber})`,
        referenceType: REFERENCE_TYPES.KEGIATAN_PAYMENT,
        referenceId: residentPayment.id,
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        createdBy: approvedBy,
      });

      this.logger.log(`Cash transaction created from kegiatan payment: ${transactionNumber}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create cash transaction from kegiatan payment:`, error);
      throw error;
    }
  }

  /**
   * Create cash transaction from a verified resident payment (manual form).
   * Called automatically when a resident payment is verified.
   */
  async createFromResidentPayment(residentPayment: any, verifiedBy: string): Promise<any> {
    try {
      // Find resident payment income category
      const category = await this.transactionCategoriesRepository.findByCategoryCode('RESIDENT-MASUK');
      if (!category) {
        this.logger.warn('RESIDENT_PAYMENT-MASUK category not found, skipping cash transaction creation');
        return null;
      }

      // Generate transaction number
      const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber('INCOME');

      // Create cash transaction
      const transaction = await this.cashTransactionsRepository.create({
        transactionNumber,
        transactionDate: residentPayment.paymentDate,
        transactionType: 'INCOME',
        amount: residentPayment.amount,
        categoryId: category.id,
        description: `Resident Payment ${residentPayment.paymentNumber} - ${residentPayment.resident?.firstName || ''} ${residentPayment.resident?.lastName || ''} (Ref: ${residentPayment.referenceNumber})`,
        referenceType: REFERENCE_TYPES.RESIDENT_PAYMENT,
        referenceId: residentPayment.id,
        status: 'APPROVED',
        approvedBy: verifiedBy,
        approvedAt: new Date(),
        createdBy: verifiedBy,
      });

      this.logger.log(`Cash transaction created from resident payment: ${transactionNumber}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create cash transaction from resident payment:`, error);
      throw error;
    }
  }

  /**
   * Get IPL-specific report
   */
  async getIplReport(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.cashTransactionsRepository.getIplStatistics(start, end);
  }

  /**
   * Get Kegiatan-specific report
   */
  async getKegiatanReport(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.cashTransactionsRepository.getKegiatanStatistics(start, end);
  }

  /**
   * Build an Excel (.xlsx) buffer + filename for a financial report.
   * @param reportLabel - short label used in the title and filename (e.g. "IPL")
   * @param referenceTypes - reference types that scope the report transactions
   */
  private async buildReportExport(
    reportLabel: string,
    referenceTypes: string[],
    startDate?: string,
    endDate?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const { transactions, summary, breakdown } =
      await this.cashTransactionsRepository.getReportData(referenceTypes, start, end);

    const buffer = await buildReportWorkbook({
      title: `Laporan ${reportLabel}`,
      period: { startDate, endDate },
      summary,
      breakdown,
      transactions,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `Laporan-${reportLabel}_${startDate || stamp}_${endDate || stamp}.xlsx`;

    return { buffer, filename };
  }

  /**
   * Export IPL report to Excel (.xlsx)
   */
  async exportIplReport(
    startDate?: string,
    endDate?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    return this.buildReportExport(
      'IPL',
      [REFERENCE_TYPES.IPL_PAYMENT, REFERENCE_TYPES.IPL_EXPENSE],
      startDate,
      endDate,
    );
  }

  /**
   * Export Kegiatan report to Excel (.xlsx)
   */
  async exportKegiatanReport(
    startDate?: string,
    endDate?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    return this.buildReportExport(
      'Kegiatan',
      [REFERENCE_TYPES.KEGIATAN_PAYMENT, REFERENCE_TYPES.KEGIATAN_EXPENSE],
      startDate,
      endDate,
    );
  }

  /**
   * Get transactions by reference type
   */
  async getByReferenceType(referenceType: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.cashTransactionsRepository.getByReferenceType(referenceType, start, end);
  }
}
