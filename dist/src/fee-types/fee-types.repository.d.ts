import { PrismaService } from '../prisma/prisma.service';
import { FeeType } from '@prisma/client';
export declare class FeeTypesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        feeTypes: FeeType[];
        total: number;
    }>;
    findById(id: string): Promise<FeeType>;
    findByFeeCode(feeCode: string): Promise<FeeType | null>;
    create(data: any): Promise<FeeType>;
    update(id: string, data: any): Promise<FeeType>;
    softDelete(id: string): Promise<FeeType>;
    restore(id: string): Promise<FeeType>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getActiveFeeTypes(): Promise<FeeType[]>;
    getByCategory(category: string): Promise<FeeType[]>;
}
