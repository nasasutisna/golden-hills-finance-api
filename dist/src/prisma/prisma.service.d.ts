import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    cleanDatabase(): Promise<any[] | undefined>;
    executeInTransaction<T>(callback: (tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>, maxRetries?: number): Promise<T>;
    softDelete(model: any, where: any, userId: string): Promise<any>;
    exists(model: any, where: any): Promise<boolean>;
    findOrThrow(model: any, where: any, errorMessage?: string): Promise<any>;
    paginate(model: any, params: {
        where?: any;
        orderBy?: any;
        page?: number;
        limit?: number;
        include?: any;
        select?: any;
    }): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    search(model: any, params: {
        search?: string;
        searchFields?: string[];
        where?: any;
        page?: number;
        limit?: number;
        orderBy?: any;
        include?: any;
    }): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    filter(model: any, params: {
        filters?: Record<string, any>;
        page?: number;
        limit?: number;
        orderBy?: any;
        include?: any;
    }): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
}
export type PrismaTransactionalClient = Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
