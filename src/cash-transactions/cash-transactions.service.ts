import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import { CashTransactionsRepository } from './cash-transactions.repository';
import { ApprovalHistoriesService } from '../approval-histories/approval-histories.service';
import { ApprovalAction } from '../approval-histories/dto/create-approval-history.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserData } from '../common/decorators/current-user.decorator';

@Injectable()
export class CashTransactionsService {
  private readonly logger = new Logger(CashTransactionsService.name);

  constructor(
    private readonly cashTransactionsRepository: CashTransactionsRepository,
    private readonly approvalHistoriesService: ApprovalHistoriesService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'transactionDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
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

  async getTransactionStatistics(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.cashTransactionsRepository.getTransactionStatistics(start, end);
  }

  async count(where?: any): Promise<number> {
    return await this.cashTransactionsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.cashTransactionsRepository.exists(id);
  }
}
