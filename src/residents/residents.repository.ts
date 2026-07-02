import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resident } from '@prisma/client';

@Injectable()
export class ResidentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<{ residents: Resident[]; total: number }> {
    const { skip, take, where, orderBy, include } = params;

    const [residents, total] = await Promise.all([
      this.prisma.resident.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: include || {
          houseBlock: {
            select: {
              id: true,
              blockCode: true,
              blockName: true,
              address: true,
            },
          },
        },
      }),
      this.prisma.resident.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { residents, total };
  }

  async findById(id: string, include?: any): Promise<Resident> {
    const resident = await this.prisma.resident.findFirst({
      where: { id, deletedAt: null },
      include: include || {
        houseBlock: true,
        residentInvoices: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        residentPayments: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    return resident;
  }

  async findByResidentCode(residentCode: string): Promise<Resident | null> {
    return this.prisma.resident.findFirst({
      where: { residentCode, deletedAt: null },
      include: { houseBlock: true },
    });
  }

  async create(data: any): Promise<Resident> {
    return this.prisma.resident.create({
      data,
      include: { houseBlock: true },
    });
  }

  async update(id: string, data: any): Promise<Resident> {
    try {
      return await this.prisma.resident.update({
        where: { id },
        data,
        include: { houseBlock: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Resident not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<Resident> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
  }

  async restore(id: string): Promise<Resident> {
    return this.prisma.resident.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      include: { houseBlock: true },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.resident.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.resident.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getActiveResidentsCount(): Promise<number> {
    return this.prisma.resident.count({
      where: { isActive: true, deletedAt: null },
    });
  }

  async getByHouseBlock(houseBlockId: string): Promise<Resident[]> {
    return this.prisma.resident.findMany({
      where: { houseBlockId, deletedAt: null },
      include: { houseBlock: true },
      orderBy: { unitNumber: 'asc' },
    });
  }

  async updateBalance(residentId: string): Promise<void> {
    // Calculate balance from invoices and payments
    const invoices = await this.prisma.residentInvoice.findMany({
      where: { residentId, deletedAt: null, status: { in: ['PENDING', 'PARTIAL'] } },
    });

    const payments = await this.prisma.residentPayment.findMany({
      where: { residentId, deletedAt: null },
    });

    const totalInvoices = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

    // Note: You might want to add a balance field to the Resident model
    // For now, this is calculated dynamically
  }
}
