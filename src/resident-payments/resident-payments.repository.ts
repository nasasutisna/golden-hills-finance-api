import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { ResidentPayment } from '@prisma/client';

@Injectable()
export class ResidentPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<{ payments: ResidentPayment[]; total: number }> {
    const { skip, take, where, orderBy, include } = params;

    const [payments, total] = await Promise.all([
      this.prisma.residentPayment.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: include || {
          resident: {
            select: {
              id: true,
              residentCode: true,
              firstName: true,
              lastName: true,
              unitNumber: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.residentPayment.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { payments, total };
  }

  async findById(id: string): Promise<ResidentPayment> {
    const payment = await this.prisma.residentPayment.findFirst({
      where: { id, deletedAt: null },
      include: {
        resident: true,
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async create(data: any, tx?: PrismaTransactionalClient): Promise<ResidentPayment> {
    const prisma = tx || this.prisma;
    return prisma.residentPayment.create({
      data,
      include: { resident: true, invoice: true },
    });
  }

  async update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<ResidentPayment> {
    const prisma = tx || this.prisma;
    try {
      return await prisma.residentPayment.update({
        where: { id },
        data,
        include: { resident: true, invoice: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Payment not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<ResidentPayment> {
    return this.update(id, { deletedAt: new Date() });
  }

  async getByResident(residentId: string): Promise<ResidentPayment[]> {
    return this.prisma.residentPayment.findMany({
      where: { residentId, deletedAt: null },
      include: { invoice: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getByInvoice(invoiceId: string): Promise<ResidentPayment[]> {
    return this.prisma.residentPayment.findMany({
      where: { invoiceId, deletedAt: null },
      include: { resident: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async verifyPayment(
    paymentId: string,
    verifiedBy: string,
    tx?: PrismaTransactionalClient,
  ): Promise<ResidentPayment> {
    return this.update(
      paymentId,
      {
        status: 'COMPLETED',
        verifiedBy,
        verifiedAt: new Date(),
      },
      tx,
    );
  }

  async generatePaymentNumber(): Promise<string> {
    const count = await this.prisma.residentPayment.count();
    const timestamp = Date.now().toString().slice(-6);
    return `PAY${timestamp}${String(count + 1).padStart(4, '0')}`;
  }

  async getPaymentStatistics(residentId?: string): Promise<any> {
    const where: any = { deletedAt: null };
    if (residentId) {
      where.residentId = residentId;
    }

    const [totalPayments, totalAmount] = await Promise.all([
      this.prisma.residentPayment.count({ where }),
      this.prisma.residentPayment.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPayments,
      totalAmount: Number(totalAmount._sum.amount || 0),
    };
  }

  async count(where?: any): Promise<number> {
    return this.prisma.residentPayment.count({ where: { ...where, deletedAt: null } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.residentPayment.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  async bulkCreate(
    payments: any[],
    tx?: PrismaTransactionalClient,
  ): Promise<{ successful: ResidentPayment[]; failed: Array<{ payment: any; error: string }> }> {
    const prisma = tx || this.prisma;
    const successful: ResidentPayment[] = [];
    const failed: Array<{ payment: any; error: string }> = [];

    for (const payment of payments) {
      try {
        const created = await prisma.residentPayment.create({
          data: payment,
          include: { resident: true, invoice: true },
        });
        successful.push(created);
      } catch (error) {
        failed.push({
          payment,
          error: error.message || 'Unknown error',
        });
      }
    }

    return { successful, failed };
  }

  async createManyInTransaction(
    payments: any[],
    tx: PrismaTransactionalClient,
  ): Promise<ResidentPayment[]> {
    const createdPayments: ResidentPayment[] = [];

    for (const payment of payments) {
      const created = await tx.residentPayment.create({
        data: payment,
        include: { resident: true, invoice: true },
      });
      createdPayments.push(created);
    }

    return createdPayments;
  }

  /**
   * Raw data for the resident payment (Iuran Warga) matrix: all active units
   * (with their first resident + block) and every resident payment in the
   * given year. The service reduces these into the final unit x month matrix.
   * Mirrors `IplPaymentsRepository.getMatrixData`.
   */
  async getMatrixData(year: number, houseBlockId?: string) {
    const units = await this.prisma.houseUnit.findMany({
      where: { deletedAt: null, ...(houseBlockId ? { houseBlockId } : {}) },
      select: {
        id: true,
        unitCode: true,
        unitNumber: true,
        landArea: true,
        buildingArea: true,
        occupancyStatus: true,
        isActive: true,
        houseBlock: { select: { blockCode: true, blockName: true } },
        residents: {
          where: { deletedAt: null, isActive: true },
          select: { id: true, firstName: true, lastName: true, phoneNumber: true },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const payments = await this.prisma.residentPayment.findMany({
      where: {
        deletedAt: null,
        paymentDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
        ...(houseBlockId ? { resident: { houseBlockId } } : {}),
      },
      select: {
        id: true,
        paymentDate: true,
        amount: true,
        status: true,
        resident: { select: { houseUnitId: true } },
      },
    });

    return { units, payments };
  }
}
