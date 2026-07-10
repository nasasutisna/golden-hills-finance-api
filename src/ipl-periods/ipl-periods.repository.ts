import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IplPeriod } from '@prisma/client';

@Injectable()
export class IplPeriodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ periods: IplPeriod[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [periods, total] = await Promise.all([
      this.prisma.iplPeriod.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: { payments: true },
          },
        },
      }),
      this.prisma.iplPeriod.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { periods, total };
  }

  async findById(id: string): Promise<IplPeriod> {
    const period = await this.prisma.iplPeriod.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('IPL period not found');
    }

    return period;
  }

  async findByPeriodCode(periodCode: string): Promise<IplPeriod | null> {
    return this.prisma.iplPeriod.findFirst({
      where: { periodCode, deletedAt: null },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });
  }

  async findByMonthYear(month: number, year: number): Promise<IplPeriod | null> {
    return this.prisma.iplPeriod.findFirst({
      where: { month, year, deletedAt: null },
    });
  }

  async create(data: any): Promise<IplPeriod> {
    return this.prisma.iplPeriod.create({
      data,
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });
  }

  async update(id: string, data: any): Promise<IplPeriod> {
    try {
      return await this.prisma.iplPeriod.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { payments: true },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('IPL period not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<IplPeriod> {
    return this.update(id, {
      deletedAt: new Date(),
      status: 'CLOSED',
    });
  }

  async restore(id: string): Promise<IplPeriod> {
    return this.prisma.iplPeriod.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.iplPeriod.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.iplPeriod.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getActivePeriods(): Promise<IplPeriod[]> {
    return this.prisma.iplPeriod.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getCurrentPeriod(): Promise<IplPeriod | null> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return this.prisma.iplPeriod.findFirst({
      where: {
        month,
        year,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  /**
   * Get periods with payment statistics
   * Returns periods with aggregated payment data (count, amounts by status)
   */
  async findWithStats(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ periods: any[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const periods = await this.prisma.iplPeriod.findMany({
      where: { ...where, deletedAt: null },
      skip,
      take,
      orderBy,
      include: {
        payments: {
          where: { deletedAt: null },
          select: {
            status: true,
            calculatedAmount: true,
          },
        },
      },
    });

    // Aggregate statistics for each period
    const periodsWithStats = periods.map((period) => {
      const payments = period.payments || [];
      const paymentCount = payments.length;

      const totalAmount = payments.reduce((sum, p) => sum + (p.calculatedAmount?.toNumber() || 0), 0);
      const approvedAmount = payments
        .filter((p) => p.status === 'APPROVED')
        .reduce((sum, p) => sum + (p.calculatedAmount?.toNumber() || 0), 0);
      const pendingAmount = payments
        .filter((p) => p.status === 'PENDING')
        .reduce((sum, p) => sum + (p.calculatedAmount?.toNumber() || 0), 0);

      // Remove payments from the response
      const { payments: _, ...periodData } = period;

      return {
        ...periodData,
        paymentCount,
        totalAmount,
        approvedAmount,
        pendingAmount,
      };
    });

    const total = await this.prisma.iplPeriod.count({
      where: { ...where, deletedAt: null },
    });

    return { periods: periodsWithStats, total };
  }
}
