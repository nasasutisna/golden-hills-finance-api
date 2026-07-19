import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { ResidentPayment } from '@prisma/client';
export declare class ResidentPaymentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
        include?: any;
    }): Promise<{
        payments: ResidentPayment[];
        total: number;
    }>;
    findById(id: string): Promise<ResidentPayment>;
    create(data: any, tx?: PrismaTransactionalClient): Promise<ResidentPayment>;
    update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<ResidentPayment>;
    softDelete(id: string): Promise<ResidentPayment>;
    getByResident(residentId: string): Promise<ResidentPayment[]>;
    getByInvoice(invoiceId: string): Promise<ResidentPayment[]>;
    verifyPayment(paymentId: string, verifiedBy: string, tx?: PrismaTransactionalClient): Promise<ResidentPayment>;
    generatePaymentNumber(): Promise<string>;
    getPaymentStatistics(residentId?: string): Promise<any>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    bulkCreate(payments: any[], tx?: PrismaTransactionalClient): Promise<{
        successful: ResidentPayment[];
        failed: Array<{
            payment: any;
            error: string;
        }>;
    }>;
    createManyInTransaction(payments: any[], tx: PrismaTransactionalClient): Promise<ResidentPayment[]>;
    getMatrixData(year: number, houseBlockId?: string): Promise<{
        units: {
            id: string;
            isActive: boolean;
            houseBlock: {
                blockCode: string;
                blockName: string;
            };
            residents: {
                id: string;
                firstName: string;
                lastName: string;
                phoneNumber: string | null;
            }[];
            unitCode: string;
            unitNumber: string;
            landArea: import("@prisma/client-runtime-utils").Decimal;
            buildingArea: import("@prisma/client-runtime-utils").Decimal;
            occupancyStatus: string;
        }[];
        payments: {
            id: string;
            resident: {
                houseUnitId: string | null;
            };
            status: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
        }[];
    }>;
}
