import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionCategoriesRepository } from './transaction-categories.repository';
export declare class TransactionCategoriesService {
    private readonly transactionCategoriesRepository;
    private readonly logger;
    constructor(transactionCategoriesRepository: TransactionCategoriesRepository);
    findAll(queryOptions: QueryOptionsDto): Promise<{
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
    findById(id: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryCode: string;
        categoryName: string;
        categoryType: string;
    }>;
    create(createTransactionCategoryDto: CreateTransactionCategoryDto): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryCode: string;
        categoryName: string;
        categoryType: string;
    }>;
    update(id: string, updateTransactionCategoryDto: UpdateTransactionCategoryDto): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryCode: string;
        categoryName: string;
        categoryType: string;
    }>;
    softDelete(id: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryCode: string;
        categoryName: string;
        categoryType: string;
    }>;
    restore(id: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryCode: string;
        categoryName: string;
        categoryType: string;
    }>;
    getByType(categoryType: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryCode: string;
        categoryName: string;
        categoryType: string;
    }[]>;
    getActiveCategories(): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryCode: string;
        categoryName: string;
        categoryType: string;
    }[]>;
    getParentCategories(): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryCode: string;
        categoryName: string;
        categoryType: string;
    }[]>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
