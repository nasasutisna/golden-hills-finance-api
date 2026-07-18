import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { CashTransaction } from '@prisma/client';
export declare class CashTransactionsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
        include?: any;
    }): Promise<{
        transactions: CashTransaction[];
        total: number;
    }>;
    findById(id: string): Promise<CashTransaction>;
    findByTransactionNumber(transactionNumber: string): Promise<CashTransaction | null>;
    create(data: any, tx?: PrismaTransactionalClient): Promise<CashTransaction>;
    update(id: string, data: any, tx?: PrismaTransactionalClient): Promise<CashTransaction>;
    softDelete(id: string): Promise<CashTransaction>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getByType(transactionType: string): Promise<CashTransaction[]>;
    getByCategory(categoryId: string): Promise<CashTransaction[]>;
    getByDateRange(startDate: Date, endDate: Date): Promise<CashTransaction[]>;
    getByApprovalStatus(status: string): Promise<CashTransaction[]>;
    getTransactionStatistics(startDate?: Date, endDate?: Date, categoryId?: string): Promise<{
        totalTransactions: number;
        totalIncome: number;
        totalExpense: number;
        netAmount: number;
        pendingApproval: number;
    }>;
    updateApprovalStatus(transactionId: string, status: string, approvedBy?: string, tx?: PrismaTransactionalClient): Promise<CashTransaction>;
    generateTransactionNumber(transactionType: string): Promise<string>;
    getByReferenceType(referenceType: string, startDate?: Date, endDate?: Date): Promise<CashTransaction[]>;
    getIplStatistics(startDate?: Date, endDate?: Date): Promise<{
        totalIncome: number;
        totalExpense: number;
        balance: number;
        breakdownByCategory: Record<string, number>;
    }>;
    getKegiatanStatistics(startDate?: Date, endDate?: Date): Promise<{
        totalIncome: number;
        totalExpense: number;
        balance: number;
        breakdownByCategory: Record<string, number>;
    }>;
    getReportData(referenceTypes: string[], startDate?: Date, endDate?: Date): Promise<{
        transactions: Array<{
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: number;
            description: string | null;
            referenceType: string | null;
            status: string;
            category: {
                categoryName: string;
                categoryCode: string;
            } | null;
            creator: {
                firstName: string | null;
                lastName: string | null;
                username: string;
            } | null;
        }>;
        summary: {
            totalIncome: number;
            totalExpense: number;
            balance: number;
        };
        breakdown: {
            categoryName: string;
            categoryCode: string;
            transactionCount: number;
            totalAmount: number;
        }[];
    }>;
}
