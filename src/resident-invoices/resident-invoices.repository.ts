import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { ResidentInvoice } from '@prisma/client';

@Injectable()
export class ResidentInvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<{ invoices: ResidentInvoice[]; total: number }> {
    const { skip, take, where, orderBy, include } = params;

    const [invoices, total] = await Promise.all([
      this.prisma.residentInvoice.findMany({
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
          payments: {
            where: { deletedAt: null },
            select: {
              id: true,
              paymentNumber: true,
              amount: true,
              paymentDate: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.residentInvoice.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { invoices, total };
  }

  async findById(id: string): Promise<ResidentInvoice> {
    const invoice = await this.prisma.residentInvoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        resident: true,
        payments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<ResidentInvoice | null> {
    return this.prisma.residentInvoice.findFirst({
      where: { invoiceNumber, deletedAt: null },
      include: { resident: true },
    });
  }

  async create(data: any, tx?: PrismaTransactionalClient): Promise<ResidentInvoice> {
    const prisma = tx || this.prisma;
    return prisma.residentInvoice.create({
      data,
      include: { resident: true },
    });
  }

  async update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<ResidentInvoice> {
    const prisma = tx || this.prisma;
    try {
      return await prisma.residentInvoice.update({
        where: { id },
        data,
        include: { resident: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Invoice not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<ResidentInvoice> {
    return this.update(id, {
      deletedAt: new Date(),
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.residentInvoice.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.residentInvoice.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getByResident(residentId: string): Promise<ResidentInvoice[]> {
    return this.prisma.residentInvoice.findMany({
      where: { residentId, deletedAt: null },
      include: { payments: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async getByStatus(status: string): Promise<ResidentInvoice[]> {
    return this.prisma.residentInvoice.findMany({
      where: { status, deletedAt: null },
      include: { resident: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getOverdueInvoices(): Promise<ResidentInvoice[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.residentInvoice.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: today },
        deletedAt: null,
      },
      include: { resident: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getInvoiceStatistics(residentId?: string): Promise<{
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
  }> {
    const where: any = { deletedAt: null };
    if (residentId) {
      where.residentId = residentId;
    }

    const [totalInvoices, pendingInvoices, paidInvoices, overdueInvoices, invoices] =
      await Promise.all([
        this.prisma.residentInvoice.count({ where }),
        this.prisma.residentInvoice.count({
          where: { ...where, status: 'PENDING' },
        }),
        this.prisma.residentInvoice.count({
          where: { ...where, status: 'PAID' },
        }),
        this.prisma.residentInvoice.count({
          where: {
            ...where,
            status: { in: ['PENDING', 'PARTIAL'] },
            dueDate: { lt: new Date() },
          },
        }),
        this.prisma.residentInvoice.findMany({
          where,
          select: {
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
          },
        }),
      ]);

    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.balanceAmount),
      0,
    );

    return {
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalAmount,
      totalPaid,
      totalOutstanding,
    };
  }

  async updateInvoiceStatus(
    invoiceId: string,
    status: string,
    tx?: PrismaTransactionalClient,
  ): Promise<ResidentInvoice> {
    return this.update(invoiceId, { status }, tx);
  }

  async updatePaymentAmount(
    invoiceId: string,
    paymentAmount: number,
    tx?: PrismaTransactionalClient,
  ): Promise<ResidentInvoice> {
    const invoice = await this.findById(invoiceId);
    const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
    const newOutstandingAmount = Number(invoice.totalAmount) - newPaidAmount;

    let newStatus = invoice.status;
    if (newOutstandingAmount <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    }

    return this.update(
      invoiceId,
      {
        paidAmount: newPaidAmount,
        balanceAmount: newOutstandingAmount,
        status: newStatus,
      },
      tx,
    );
  }

  async generateInvoiceNumber(): Promise<string> {
    const count = await this.prisma.residentInvoice.count();
    const timestamp = Date.now().toString().slice(-6);
    return `INV${timestamp}${String(count + 1).padStart(4, '0')}`;
  }
}
