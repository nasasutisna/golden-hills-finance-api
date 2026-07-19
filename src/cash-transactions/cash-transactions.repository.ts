import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { CashTransaction } from '@prisma/client';

@Injectable()
export class CashTransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<{ transactions: CashTransaction[]; total: number }> {
    const { skip, take, where, orderBy, include } = params;

    const [transactions, total] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: include || {
          category: {
            select: {
              id: true,
              categoryCode: true,
              categoryName: true,
              categoryType: true,
              fundType: true,
            },
          },
          cashAccount: {
            select: {
              id: true,
              accountCode: true,
              accountName: true,
              fundType: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          approver: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.cashTransaction.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { transactions, total };
  }

  async findById(id: string): Promise<CashTransaction> {
    const transaction = await this.prisma.cashTransaction.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        cashAccount: true,
        creator: true,
        approver: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Cash transaction not found');
    }

    return transaction;
  }

  async findByTransactionNumber(transactionNumber: string): Promise<CashTransaction | null> {
    return this.prisma.cashTransaction.findFirst({
      where: { transactionNumber, deletedAt: null },
      include: { category: true, creator: true, approver: true },
    });
  }

  async create(data: any, tx?: PrismaTransactionalClient): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    return prisma.cashTransaction.create({
      data,
      include: { category: true, cashAccount: true, creator: true, approver: true },
    });
  }

  async update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    try {
      return await prisma.cashTransaction.update({
        where: { id },
        data,
        include: { category: true, cashAccount: true, creator: true, approver: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Cash transaction not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<CashTransaction> {
    return this.update(id, { deletedAt: new Date() });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.cashTransaction.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.cashTransaction.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getByType(transactionType: string): Promise<CashTransaction[]> {
    return this.prisma.cashTransaction.findMany({
      where: { transactionType, deletedAt: null },
      include: { category: true, creator: true, approver: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async getByCategory(categoryId: string): Promise<CashTransaction[]> {
    return this.prisma.cashTransaction.findMany({
      where: { categoryId, deletedAt: null },
      include: { category: true, creator: true, approver: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<CashTransaction[]> {
    return this.prisma.cashTransaction.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: { category: true, creator: true, approver: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async getByApprovalStatus(status: string): Promise<CashTransaction[]> {
    return this.prisma.cashTransaction.findMany({
      where: { status, deletedAt: null },
      include: { category: true, creator: true, approver: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  /**
   * Base where-clause for ledger queries. Consolidated reports must exclude
   * inter-account transfers (they are internal movement, not real income/expense).
   */
  private baseLedgerWhere(opts: {
    excludeTransfers?: boolean;
    cashAccountId?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): any {
    const where: any = { deletedAt: null };
    if (opts.excludeTransfers) {
      where.isInternalTransfer = false;
    }
    if (opts.cashAccountId) {
      where.cashAccountId = opts.cashAccountId;
    }
    if (opts.categoryId) {
      where.categoryId = opts.categoryId;
    }
    if (opts.startDate && opts.endDate) {
      where.transactionDate = { gte: opts.startDate, lte: opts.endDate };
    }
    return where;
  }

  async getTransactionStatistics(startDate?: Date, endDate?: Date, categoryId?: string): Promise<{
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    pendingApproval: number;
  }> {
    // Consolidated view — exclude inter-account transfers.
    const where = this.baseLedgerWhere({
      excludeTransfers: true,
      categoryId,
      startDate,
      endDate,
    });

    const [transactions, totalTransactions, pendingApproval] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        where,
        select: { transactionType: true, amount: true },
      }),
      this.prisma.cashTransaction.count({ where }),
      this.prisma.cashTransaction.count({
        where: { ...where, status: 'PENDING' },
      }),
    ]);

    const totalIncome = transactions
      .filter((t) => t.transactionType === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalTransactions,
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
      pendingApproval,
    };
  }

  async updateApprovalStatus(
    transactionId: string,
    status: string,
    approvedBy?: string,
    tx?: PrismaTransactionalClient,
  ): Promise<CashTransaction> {
    const updateData: any = { status };
    if (approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }

    return this.update(transactionId, updateData, tx);
  }

  async generateTransactionNumber(transactionType: string): Promise<string> {
    const prefix = transactionType === 'INCOME' ? 'INC' : 'EXP';
    const count = await this.prisma.cashTransaction.count({
      where: { transactionType },
    });
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Get transactions by reference type with optional date range filter
   */
  async getByReferenceType(
    referenceType: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CashTransaction[]> {
    const where: any = { referenceType, deletedAt: null };
    if (startDate && endDate) {
      where.transactionDate = { gte: startDate, lte: endDate };
    }
    return this.prisma.cashTransaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            categoryCode: true,
            categoryName: true,
            categoryType: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  /**
   * Per-Kas statistics: all transactions on one cash account (excluding
   * inter-account transfers), with income/expense/balance + expense
   * breakdown by category.
   */
  async getStatisticsByAccount(
    cashAccountId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    breakdownByCategory: Record<string, number>;
  }> {
    const where = this.baseLedgerWhere({
      excludeTransfers: true,
      cashAccountId,
      startDate,
      endDate,
    });

    const transactions = await this.prisma.cashTransaction.findMany({
      where,
      include: {
        category: {
          select: { id: true, categoryCode: true, categoryName: true },
        },
      },
    });

    const income = transactions
      .filter((t) => t.transactionType === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const breakdownByCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.transactionType === 'EXPENSE' && t.category) {
        const name = t.category.categoryName;
        breakdownByCategory[name] = (breakdownByCategory[name] || 0) + Number(t.amount);
      }
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      breakdownByCategory,
    };
  }

  /**
   * Get full report data for Excel export: raw transactions + computed summary
   * and per-category breakdown, scoped to a single cash account (Kas).
   */
  async getReportData(
    cashAccountId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    transactions: Array<{
      transactionNumber: string;
      transactionDate: Date;
      transactionType: string;
      amount: number;
      description: string | null;
      referenceType: string | null;
      status: string;
      category: { categoryName: string; categoryCode: string } | null;
      creator: {
        firstName: string | null;
        lastName: string | null;
        username: string;
      } | null;
    }>;
    summary: { totalIncome: number; totalExpense: number; balance: number };
    breakdown: {
      categoryName: string;
      categoryCode: string;
      transactionCount: number;
      totalAmount: number;
    }[];
  }> {
    const where = this.baseLedgerWhere({
      excludeTransfers: true,
      cashAccountId,
      startDate,
      endDate,
    });

    const rows = await this.prisma.cashTransaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            categoryCode: true,
            categoryName: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    const totalIncome = rows
      .filter((t) => t.transactionType === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = rows
      .filter((t) => t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Breakdown per category across all transactions in scope
    const breakdownMap = new Map<
      string,
      {
        categoryName: string;
        categoryCode: string;
        transactionCount: number;
        totalAmount: number;
      }
    >();
    for (const t of rows) {
      if (!t.category) continue;
      const key = t.category.id;
      const existing = breakdownMap.get(key);
      if (existing) {
        existing.transactionCount += 1;
        existing.totalAmount += Number(t.amount);
      } else {
        breakdownMap.set(key, {
          categoryName: t.category.categoryName,
          categoryCode: t.category.categoryCode,
          transactionCount: 1,
          totalAmount: Number(t.amount),
        });
      }
    }

    // Map to plain serializable rows (amount as number) for the export layer
    const transactions = rows.map((t) => ({
      transactionNumber: t.transactionNumber,
      transactionDate: t.transactionDate,
      transactionType: t.transactionType,
      amount: Number(t.amount),
      description: t.description,
      referenceType: t.referenceType,
      status: t.status,
      category: t.category
        ? {
            categoryName: t.category.categoryName,
            categoryCode: t.category.categoryCode,
          }
        : null,
      creator: t.creator
        ? {
            firstName: t.creator.firstName,
            lastName: t.creator.lastName,
            username: t.creator.username,
          }
        : null,
    }));

    return {
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
      breakdown: Array.from(breakdownMap.values()),
    };
  }

  // ---------- Cash accounts (Kas) ----------

  async getCashAccounts() {
    return this.prisma.cashAccount.findMany({
      where: { deletedAt: null },
      orderBy: { accountCode: 'asc' },
    });
  }

  async findCashAccountByCode(accountCode: string) {
    return this.prisma.cashAccount.findFirst({
      where: { accountCode, deletedAt: null },
    });
  }

  /**
   * Per-account balances. `balance` is all-time (opening + Σincome − Σexpense,
   * transfers included since they are normal legs). When a date range is given,
   * `period*` fields additionally report the flow within that window.
   */
  async getAccountBalances(startDate?: Date, endDate?: Date) {
    const accounts = await this.getCashAccounts();

    const sumByAccount = async (dateFilter?: any) => {
      const rows = await this.prisma.cashTransaction.findMany({
        where: { deletedAt: null, ...(dateFilter ?? {}) },
        select: { cashAccountId: true, transactionType: true, amount: true },
      });
      const map = new Map<string, { income: number; expense: number }>();
      for (const t of rows) {
        if (!t.cashAccountId) continue;
        const acc = map.get(t.cashAccountId) ?? { income: 0, expense: 0 };
        if (t.transactionType === 'INCOME') acc.income += Number(t.amount);
        else if (t.transactionType === 'EXPENSE') acc.expense += Number(t.amount);
        map.set(t.cashAccountId, acc);
      }
      return map;
    };

    const allByAccount = await sumByAccount();
    const periodByAccount =
      startDate && endDate ? await sumByAccount({ transactionDate: { gte: startDate, lte: endDate } }) : null;

    return accounts.map((a) => {
      const all = allByAccount.get(a.id) ?? { income: 0, expense: 0 };
      const period = periodByAccount?.get(a.id) ?? { income: 0, expense: 0 };
      return {
        id: a.id,
        accountCode: a.accountCode,
        accountName: a.accountName,
        fundType: a.fundType,
        openingBalance: Number(a.openingBalance),
        balance: Number(a.openingBalance) + all.income - all.expense,
        periodIncome: period.income,
        periodExpense: period.expense,
        periodBalance: period.income - period.expense,
        isActive: a.isActive,
      };
    });
  }

  async generateTransferGroupId(): Promise<string> {
    const count = await this.prisma.cashTransaction.count({
      where: { transferGroupId: { not: null } },
    });
    const timestamp = Date.now().toString().slice(-8);
    return `TRF${timestamp}${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Soft-delete both legs of a transfer atomically. Returns the affected count.
   */
  async softDeleteByTransferGroup(
    transferGroupId: string,
    tx?: PrismaTransactionalClient,
  ): Promise<number> {
    const prisma = tx || this.prisma;
    const result = await prisma.cashTransaction.updateMany({
      where: { transferGroupId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count;
  }
}
