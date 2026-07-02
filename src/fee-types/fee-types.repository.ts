import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeType } from '@prisma/client';

@Injectable()
export class FeeTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ feeTypes: FeeType[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [feeTypes, total] = await Promise.all([
      this.prisma.feeType.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
      }),
      this.prisma.feeType.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { feeTypes, total };
  }

  async findById(id: string): Promise<FeeType> {
    const feeType = await this.prisma.feeType.findFirst({
      where: { id, deletedAt: null },
    });

    if (!feeType) {
      throw new NotFoundException('Fee type not found');
    }

    return feeType;
  }

  async findByFeeCode(feeCode: string): Promise<FeeType | null> {
    return this.prisma.feeType.findFirst({
      where: { feeCode, deletedAt: null },
    });
  }

  async create(data: any): Promise<FeeType> {
    return this.prisma.feeType.create({ data });
  }

  async update(id: string, data: any): Promise<FeeType> {
    try {
      return await this.prisma.feeType.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Fee type not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<FeeType> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
  }

  async restore(id: string): Promise<FeeType> {
    return this.prisma.feeType.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.feeType.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.feeType.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getActiveFeeTypes(): Promise<FeeType[]> {
    return this.prisma.feeType.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { feeCode: 'asc' },
    });
  }

  async getByCategory(category: string): Promise<FeeType[]> {
    return this.prisma.feeType.findMany({
      where: { feeCategory: category, deletedAt: null },
      orderBy: { feeCode: 'asc' },
    });
  }
}
