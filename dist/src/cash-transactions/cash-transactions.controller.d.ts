import { Response } from 'express';
import { CashTransactionsService } from './cash-transactions.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
export declare class CashTransactionsController {
    private readonly cashTransactionsService;
    constructor(cashTransactionsService: CashTransactionsService);
    create(createCashTransactionDto: CreateCashTransactionDto, user: CurrentUserData): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        };
    }>;
    findAll(queryOptions: QueryOptionsDto, startDate?: string, endDate?: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getSummary(startDate?: string, endDate?: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            totalTransactions: number;
            totalIncome: number;
            totalExpense: number;
            netAmount: number;
            pendingApproval: number;
        };
    }>;
    getStatistics(startDate?: string, endDate?: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            totalTransactions: number;
            totalIncome: number;
            totalExpense: number;
            netAmount: number;
            pendingApproval: number;
        };
    }>;
    getByType(transactionType: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        }[];
    }>;
    getByCategory(categoryId: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        }[];
    }>;
    getByDateRange(startDate: string, endDate: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        }[];
    }>;
    getByApprovalStatus(approvalStatus: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        };
    }>;
    update(id: string, updateCashTransactionDto: UpdateCashTransactionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        };
    }>;
    approveTransaction(id: string, user: CurrentUserData): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        };
    }>;
    rejectTransaction(id: string, reason: string, user: CurrentUserData): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        };
    }>;
    remove(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        };
    }>;
    getIplReport(startDate?: string, endDate?: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            totalIncome: number;
            totalExpense: number;
            balance: number;
            breakdownByCategory: Record<string, number>;
        };
    }>;
    getKegiatanReport(startDate?: string, endDate?: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            totalIncome: number;
            totalExpense: number;
            balance: number;
            breakdownByCategory: Record<string, number>;
        };
    }>;
    exportIplReport(res: Response, startDate?: string, endDate?: string): Promise<void>;
    exportKegiatanReport(res: Response, startDate?: string, endDate?: string): Promise<void>;
    getByReferenceType(referenceType: string, startDate?: string, endDate?: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            transactionNumber: string;
            transactionDate: Date;
            transactionType: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            categoryId: string | null;
            referenceType: string | null;
            referenceId: string | null;
        }[];
    }>;
}
