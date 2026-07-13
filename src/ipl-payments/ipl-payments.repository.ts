import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { IplPayment } from '@prisma/client';

export interface IplPaymentWithFiles extends IplPayment {
  files?: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    category: string | null;
    createdAt: Date;
  }>;
  period?: {
    id: string;
    periodCode: string;
    periodName: string;
    month: number;
    year: number;
    status: string;
    baseRate?: any;
  };
  resident?: {
    id: string;
    residentCode: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
    houseUnitId?: string | null;
  };
  houseUnit?: {
    id: string;
    unitCode: string;
    unitNumber: string;
    landArea: any;
    iplPercentage: any;
    houseBlockId: string;
    houseBlock?: {
      id: string;
      blockCode: string;
      blockName: string;
      coordinatorId?: string | null;
    };
  };
  submitter?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  } | null;
  approver?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  } | null;
}

@Injectable()
export class IplPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Helper method to fetch files for a single payment
  private async getFilesForPayment(paymentId: string, prisma: PrismaService) {
    return prisma.fileAttachment.findMany({
      where: {
        entityType: 'IplPayment',
        entityId: paymentId,
        deletedAt: null,
      },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        category: true,
        createdAt: true,
      },
    });
  }

  // Helper method to fetch files for multiple payments
  private async getFilesForPayments(paymentIds: string[], prisma: PrismaService) {
    const files = await prisma.fileAttachment.findMany({
      where: {
        entityType: 'IplPayment',
        entityId: { in: paymentIds },
        deletedAt: null,
      },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        category: true,
        createdAt: true,
        entityId: true,
      },
    });

    // Group files by entityId
    const filesByPaymentId = new Map<string, any[]>();
    files.forEach((file: any) => {
      const { entityId, ...fileData } = file;
      if (!filesByPaymentId.has(entityId)) {
        filesByPaymentId.set(entityId, []);
      }
      filesByPaymentId.get(entityId)!.push(fileData);
    });

    return filesByPaymentId;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ payments: IplPaymentWithFiles[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [payments, total] = await Promise.all([
      this.prisma.iplPayment.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        select: {
          id: true,
          paymentNumber: true,
          periodId: true,
          residentId: true,
          houseUnitId: true,
          paymentDate: true,
          landArea: true,
          iplPercentage: true,
          baseRate: true,
          calculatedAmount: true,
          paymentMethod: true,
          referenceNumber: true,
          notes: true,
          status: true,
          approvedBy: true,
          approvedAt: true,
          rejectionReason: true,
          submittedBy: true,
          paymentGroupId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          period: {
            select: {
              id: true,
              periodCode: true,
              periodName: true,
              month: true,
              year: true,
              status: true,
            },
          },
          resident: {
            select: {
              id: true,
              residentCode: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              houseUnitId: true,
            },
          },
          houseUnit: {
            select: {
              id: true,
              unitCode: true,
              unitNumber: true,
              landArea: true,
              iplPercentage: true,
              houseBlockId: true,
            },
          },
          submitter: {
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
      this.prisma.iplPayment.count({ where: { ...where, deletedAt: null } }),
    ]);

    // Fetch files for all payments
    const paymentIds = payments.map((p) => p.id);
    const filesByPaymentId = await this.getFilesForPayments(paymentIds, this.prisma);

    // Attach files to each payment
    const paymentsWithFiles = payments.map((payment) => ({
      ...payment,
      files: filesByPaymentId.get(payment.id) || [],
    }));

    return { payments: paymentsWithFiles, total };
  }

  async findById(id: string): Promise<IplPaymentWithFiles> {
    const payment = await this.prisma.iplPayment.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        paymentNumber: true,
        periodId: true,
        residentId: true,
        houseUnitId: true,
        paymentDate: true,
        landArea: true,
        iplPercentage: true,
        baseRate: true,
        calculatedAmount: true,
        paymentMethod: true,
        referenceNumber: true,
        notes: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
        rejectionReason: true,
        submittedBy: true,
        paymentGroupId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        period: {
          select: {
            id: true,
            periodCode: true,
            periodName: true,
            month: true,
            year: true,
            status: true,
            baseRate: true,
          },
        },
        resident: {
          select: {
            id: true,
            residentCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            houseUnitId: true,
          },
        },
        houseUnit: {
          select: {
            id: true,
            unitCode: true,
            unitNumber: true,
            landArea: true,
            iplPercentage: true,
            houseBlockId: true,
            houseBlock: {
              select: {
                id: true,
                blockCode: true,
                blockName: true,
                coordinatorId: true,
              },
            },
          },
        },
        submitter: {
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
    });

    if (!payment) {
      throw new NotFoundException('IPL payment not found');
    }

    // Fetch files for this payment
    const files = await this.getFilesForPayment(id, this.prisma);

    return { ...payment, files };
  }

  async findByPaymentNumber(paymentNumber: string): Promise<IplPayment | null> {
    return this.prisma.iplPayment.findFirst({
      where: { paymentNumber, deletedAt: null },
      include: {
        period: true,
        resident: true,
        houseUnit: true,
      },
    });
  }

  async findByPaymentGroupId(groupId: string): Promise<IplPaymentWithFiles[]> {
    const payments = await this.prisma.iplPayment.findMany({
      where: { paymentGroupId: groupId, deletedAt: null },
      select: {
        id: true,
        paymentNumber: true,
        periodId: true,
        residentId: true,
        houseUnitId: true,
        paymentDate: true,
        landArea: true,
        iplPercentage: true,
        baseRate: true,
        calculatedAmount: true,
        paymentMethod: true,
        referenceNumber: true,
        notes: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
        rejectionReason: true,
        submittedBy: true,
        paymentGroupId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        period: {
          select: {
            id: true,
            periodCode: true,
            periodName: true,
            month: true,
            year: true,
            status: true,
            baseRate: true,
          },
        },
        resident: {
          select: {
            id: true,
            residentCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            houseUnitId: true,
          },
        },
        houseUnit: {
          select: {
            id: true,
            unitCode: true,
            unitNumber: true,
            landArea: true,
            iplPercentage: true,
            houseBlockId: true,
            houseBlock: {
              select: {
                id: true,
                blockCode: true,
                blockName: true,
                coordinatorId: true,
              },
            },
          },
        },
        submitter: {
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
      orderBy: { paymentDate: 'asc' },
    });

    if (!payments || payments.length === 0) {
      throw new NotFoundException('Payment group not found');
    }

    // Fetch files for all payments in the group
    const paymentIds = payments.map((p) => p.id);
    const filesByPaymentId = await this.getFilesForPayments(paymentIds, this.prisma);

    // Attach files to each payment
    const paymentsWithFiles = payments.map((payment) => ({
      ...payment,
      files: filesByPaymentId.get(payment.id) || [],
    }));

    return paymentsWithFiles;
  }

  async getByResident(residentId: string): Promise<IplPayment[]> {
    return this.prisma.iplPayment.findMany({
      where: { residentId, deletedAt: null },
      include: {
        period: true,
        houseUnit: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getByPeriod(periodId: string): Promise<IplPayment[]> {
    return this.prisma.iplPayment.findMany({
      where: { periodId, deletedAt: null },
      include: {
        resident: true,
        houseUnit: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getByHouseBlock(houseBlockId: string): Promise<IplPayment[]> {
    return this.prisma.iplPayment.findMany({
      where: {
        houseUnit: { houseBlockId },
        deletedAt: null,
      },
      include: {
        period: true,
        resident: true,
        houseUnit: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async create(data: any, tx?: PrismaTransactionalClient): Promise<IplPaymentWithFiles> {
    const prisma = tx || this.prisma;
    const payment = await prisma.iplPayment.create({
      data,
      select: {
        id: true,
        paymentNumber: true,
        periodId: true,
        residentId: true,
        houseUnitId: true,
        paymentDate: true,
        landArea: true,
        iplPercentage: true,
        baseRate: true,
        calculatedAmount: true,
        paymentMethod: true,
        referenceNumber: true,
        notes: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
        rejectionReason: true,
        submittedBy: true,
        paymentGroupId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        period: true,
        resident: true,
        houseUnit: true,
        submitter: {
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
    });

    // Fetch files for this payment
    const files = await this.getFilesForPayment(payment.id, prisma as PrismaService);

    return { ...payment, files };
  }

  async update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<IplPayment> {
    const prisma = tx || this.prisma;
    try {
      return await prisma.iplPayment.update({
        where: { id },
        data,
        include: {
          period: true,
          resident: true,
          houseUnit: true,
          approver: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('IPL payment not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<IplPayment> {
    return this.update(id, {
      deletedAt: new Date(),
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.iplPayment.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.iplPayment.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getPaymentStatistics(periodId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
  }> {
    const where: any = { deletedAt: null };
    if (periodId) {
      where.periodId = periodId;
    }

    const [total, pending, approved, rejected, payments] = await Promise.all([
      this.prisma.iplPayment.count({ where }),
      this.prisma.iplPayment.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.iplPayment.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.iplPayment.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.iplPayment.findMany({
        where: { ...where, status: 'APPROVED' },
        select: { calculatedAmount: true },
      }),
    ]);

    const totalAmount = payments.reduce(
      (sum, p) => sum + Number(p.calculatedAmount),
      0,
    );

    return {
      total,
      pending,
      approved,
      rejected,
      totalAmount,
    };
  }

  generatePaymentNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `IPL${timestamp}${random}`;
  }

  // Check for existing payments (used for multi-month validation)
  async checkExistingPayments(residentId: string, periodIds: string[]): Promise<string[]> {
    const existing = await this.prisma.iplPayment.findMany({
      where: {
        residentId,
        periodId: { in: periodIds },
        deletedAt: null,
      },
      select: { periodId: true },
    });
    return existing.map((e) => e.periodId);
  }
}
