import { PrismaService } from '../prisma/prisma.service';
import { TransactionCategory } from '@prisma/client';
export declare class TransactionCategoriesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        categories: TransactionCategory[];
        total: number;
    }>;
    findById(id: string): Promise<TransactionCategory>;
    findByCategoryCode(categoryCode: string): Promise<TransactionCategory | null>;
    create(data: any): Promise<TransactionCategory>;
    update(id: string, data: any): Promise<TransactionCategory>;
    softDelete(id: string): Promise<TransactionCategory>;
    restore(id: string): Promise<TransactionCategory>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getByType(categoryType: string): Promise<TransactionCategory[]>;
    getActiveCategories(): Promise<TransactionCategory[]>;
    getParentCategories(): Promise<TransactionCategory[]>;
}
