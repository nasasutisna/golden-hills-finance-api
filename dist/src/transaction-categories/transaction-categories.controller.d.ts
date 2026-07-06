import { TransactionCategoriesService } from './transaction-categories.service';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
export declare class TransactionCategoriesController {
    private readonly transactionCategoriesService;
    constructor(transactionCategoriesService: TransactionCategoriesService);
    create(createTransactionCategoryDto: CreateTransactionCategoryDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            categoryCode: string;
            categoryName: string;
            categoryType: string;
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
            categoryCode: string;
            categoryName: string;
            categoryType: string;
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
            categoryCode: string;
            categoryName: string;
            categoryType: string;
        }[];
    }>;
    getByType(categoryType: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            categoryCode: string;
            categoryName: string;
            categoryType: string;
        }[];
    }>;
    getParentCategories(): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            categoryCode: string;
            categoryName: string;
            categoryType: string;
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
            categoryCode: string;
            categoryName: string;
            categoryType: string;
        };
    }>;
    update(id: string, updateTransactionCategoryDto: UpdateTransactionCategoryDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            categoryCode: string;
            categoryName: string;
            categoryType: string;
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
            categoryCode: string;
            categoryName: string;
            categoryType: string;
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
            categoryCode: string;
            categoryName: string;
            categoryType: string;
        };
    }>;
}
