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
      include: { category: true, creator: true, approver: true },
    });
  }

  async update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    try {
      return await prisma.cashTransaction.update({
        where: { id },
        data,
        include: { category: true, creator: true, approver: true },
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

  async getTransactionStatistics(startDate?: Date, endDate?: Date, categoryId?: string): Promise<{
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    pendingApproval: number;
  }> {
    const where: any = { deletedAt: null };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (startDate && endDate) {
      where.transactionDate = { gte: startDate, lte: endDate };
    }

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
   * Get IPL-specific statistics (income from IPL_PAYMENT, expenses from IPL_EXPENSE)
   */
  async getIplStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    breakdownByCategory: Record<string, number>;
  }> {
    const where: any = {
      deletedAt: null,
      OR: [
        { referenceType: 'IPL_PAYMENT' },
        { referenceType: 'IPL_EXPENSE' },
      ],
    };
    if (startDate && endDate) {
      where.transactionDate = { gte: startDate, lte: endDate };
    }

    const transactions = await this.prisma.cashTransaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            categoryCode: true,
            categoryName: true,
          },
        },
      },
    });

    const income = transactions
      .filter((t) => t.transactionType === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Breakdown by category
    const breakdownByCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.transactionType === 'EXPENSE' && t.category) {
        const categoryName = t.category.categoryName;
        breakdownByCategory[categoryName] = (breakdownByCategory[categoryName] || 0) + Number(t.amount);
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
   * Get Kegiatan-specific statistics (income from KEGIATAN_PAYMENT, expenses from KEGIATAN_EXPENSE)
   */
  async getKegiatanStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    breakdownByCategory: Record<string, number>;
  }> {
    const where: any = {
      deletedAt: null,
      OR: [
        { referenceType: 'KEGIATAN_PAYMENT' },
        { referenceType: 'KEGIATAN_EXPENSE' },
      ],
    };
    if (startDate && endDate) {
      where.transactionDate = { gte: startDate, lte: endDate };
    }

    const transactions = await this.prisma.cashTransaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            categoryCode: true,
            categoryName: true,
          },
        },
      },
    });

    const income = transactions
      .filter((t) => t.transactionType === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Breakdown by category
    const breakdownByCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.transactionType === 'EXPENSE' && t.category) {
        const categoryName = t.category.categoryName;
        breakdownByCategory[categoryName] = (breakdownByCategory[categoryName] || 0) + Number(t.amount);
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
   * and per-category breakdown. Runs a single query covering all given
   * reference types (e.g. IPL_PAYMENT + IPL_EXPENSE).
   */
  async getReportData(
    referenceTypes: string[],
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
    const where: any = {
      deletedAt: null,
      referenceType: { in: referenceTypes },
    };
    if (startDate && endDate) {
      where.transactionDate = { gte: startDate, lte: endDate };
    }

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
}
