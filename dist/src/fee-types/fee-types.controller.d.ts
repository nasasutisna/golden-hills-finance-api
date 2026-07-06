import { FeeTypesService } from './fee-types.service';
import { CreateFeeTypeDto } from './dto/create-fee-type.dto';
import { UpdateFeeTypeDto } from './dto/update-fee-type.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
export declare class FeeTypesController {
    private readonly feeTypesService;
    constructor(feeTypesService: FeeTypesService);
    create(createFeeTypeDto: CreateFeeTypeDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            feeCode: string;
            feeName: string;
            feeCategory: string;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            isTaxable: boolean;
            defaultAmount: import("@prisma/client-runtime-utils").Decimal | null;
            taxRate: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expiryDate: Date | null;
        };
    }>;
    findAll(queryOptions: QueryOptionsDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            feeCode: string;
            feeName: string;
            feeCategory: string;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            isTaxable: boolean;
            defaultAmount: import("@prisma/client-runtime-utils").Decimal | null;
            taxRate: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expiryDate: Date | null;
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
    getActive(): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            feeCode: string;
            feeName: string;
            feeCategory: string;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            isTaxable: boolean;
            defaultAmount: import("@prisma/client-runtime-utils").Decimal | null;
            taxRate: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expiryDate: Date | null;
        }[];
    }>;
    getByCategory(category: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            feeCode: string;
            feeName: string;
            feeCategory: string;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            isTaxable: boolean;
            defaultAmount: import("@prisma/client-runtime-utils").Decimal | null;
            taxRate: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expiryDate: Date | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            feeCode: string;
            feeName: string;
            feeCategory: string;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            isTaxable: boolean;
            defaultAmount: import("@prisma/client-runtime-utils").Decimal | null;
            taxRate: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expiryDate: Date | null;
        };
    }>;
    update(id: string, updateFeeTypeDto: UpdateFeeTypeDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            feeCode: string;
            feeName: string;
            feeCategory: string;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            isTaxable: boolean;
            defaultAmount: import("@prisma/client-runtime-utils").Decimal | null;
            taxRate: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expiryDate: Date | null;
        };
    }>;
    remove(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            feeCode: string;
            feeName: string;
            feeCategory: string;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            isTaxable: boolean;
            defaultAmount: import("@prisma/client-runtime-utils").Decimal | null;
            taxRate: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expiryDate: Date | null;
        };
    }>;
    restore(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            feeCode: string;
            feeName: string;
            feeCategory: string;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            isTaxable: boolean;
            defaultAmount: import("@prisma/client-runtime-utils").Decimal | null;
            taxRate: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expiryDate: Date | null;
        };
    }>;
}
