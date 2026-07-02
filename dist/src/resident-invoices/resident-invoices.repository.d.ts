import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { ResidentInvoice } from '@prisma/client';
export declare class ResidentInvoicesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
        include?: any;
    }): Promise<{
        invoices: ResidentInvoice[];
        total: number;
    }>;
    findById(id: string): Promise<ResidentInvoice>;
    findByInvoiceNumber(invoiceNumber: string): Promise<ResidentInvoice | null>;
    create(data: any, tx?: PrismaTransactionalClient): Promise<ResidentInvoice>;
    update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<ResidentInvoice>;
    softDelete(id: string): Promise<ResidentInvoice>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getByResident(residentId: string): Promise<ResidentInvoice[]>;
    getByStatus(status: string): Promise<ResidentInvoice[]>;
    getOverdueInvoices(): Promise<ResidentInvoice[]>;
    getInvoiceStatistics(residentId?: string): Promise<{
        totalInvoices: number;
        pendingInvoices: number;
        paidInvoices: number;
        overdueInvoices: number;
        totalAmount: number;
        totalPaid: number;
        totalOutstanding: number;
    }>;
    updateInvoiceStatus(invoiceId: string, status: string, tx?: PrismaTransactionalClient): Promise<ResidentInvoice>;
    updatePaymentAmount(invoiceId: string, paymentAmount: number, tx?: PrismaTransactionalClient): Promise<ResidentInvoice>;
    generateInvoiceNumber(): Promise<string>;
}
