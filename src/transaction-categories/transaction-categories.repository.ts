import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionCategory } from '@prisma/client';

@Injectable()
export class TransactionCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ categories: TransactionCategory[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [categories, total] = await Promise.all([
      this.prisma.transactionCategory.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: {},
      }),
      this.prisma.transactionCategory.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { categories, total };
  }

  async findById(id: string): Promise<TransactionCategory> {
    const category = await this.prisma.transactionCategory.findFirst({
      where: { id, deletedAt: null },
      include: {},
    });

    if (!category) {
      throw new NotFoundException('Transaction category not found');
    }

    return category;
  }

  async findByCategoryCode(categoryCode: string): Promise<TransactionCategory | null> {
    return this.prisma.transactionCategory.findFirst({
      where: { categoryCode, deletedAt: null },
      include: {},
    });
  }

  async create(data: any): Promise<TransactionCategory> {
    return this.prisma.transactionCategory.create({
      data,
      include: {},
    });
  }

  async update(id: string, data: any): Promise<TransactionCategory> {
    try {
      return await this.prisma.transactionCategory.update({
        where: { id },
        data,
        include: {},
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Transaction category not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<TransactionCategory> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
  }

  async restore(id: string): Promise<TransactionCategory> {
    return this.prisma.transactionCategory.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      include: {},
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.transactionCategory.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.transactionCategory.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getByType(categoryType: string): Promise<TransactionCategory[]> {
    return this.prisma.transactionCategory.findMany({
      where: { categoryType, deletedAt: null },
      include: {},
      orderBy: { categoryName: 'asc' },
    });
  }

  async getActiveCategories(): Promise<TransactionCategory[]> {
    return this.prisma.transactionCategory.findMany({
      where: { isActive: true, deletedAt: null },
      include: {},
      orderBy: [{ categoryType: 'asc' }, { categoryName: 'asc' }],
    });
  }

  async getParentCategories(): Promise<TransactionCategory[]> {
    return this.prisma.transactionCategory.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { categoryName: 'asc' },
    });
  }
}
