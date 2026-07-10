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
      include: { category: true, creator: true },
    });
  }

  async create(data: any, tx?: PrismaTransactionalClient): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    return prisma.cashTransaction.create({
      data,
      include: { category: true, creator: true },
    });
  }

  async update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    try {
      return await prisma.cashTransaction.update({
        where: { id },
        data,
        include: { category: true, creator: true },
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
      include: { category: true, creator: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async getByCategory(categoryId: string): Promise<CashTransaction[]> {
    return this.prisma.cashTransaction.findMany({
      where: { categoryId, deletedAt: null },
      include: { category: true, creator: true },
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
      include: { category: true, creator: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async getByApprovalStatus(status: string): Promise<CashTransaction[]> {
    return this.prisma.cashTransaction.findMany({
      where: { status, deletedAt: null },
      include: { category: true, creator: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async getTransactionStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    pendingApproval: number;
  }> {
    const where: any = { deletedAt: null };
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
}
