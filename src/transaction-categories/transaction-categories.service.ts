import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionCategoriesRepository } from './transaction-categories.repository';

@Injectable()
export class TransactionCategoriesService {
  private readonly logger = new Logger(TransactionCategoriesService.name);

  constructor(private readonly transactionCategoriesRepository: TransactionCategoriesRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'categoryCode', sortOrder = 'asc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    if (filters) {
      where = { ...where, ...filters };
    }

    const { categories, total } = await this.transactionCategoriesRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return await this.transactionCategoriesRepository.findById(id);
  }

  async create(createTransactionCategoryDto: CreateTransactionCategoryDto) {
    const existingCategory = await this.transactionCategoriesRepository.findByCategoryCode(
      createTransactionCategoryDto.categoryCode,
    );
    if (existingCategory) {
      throw new ConflictException('Category code already exists');
    }

    try {
      const category = await this.transactionCategoriesRepository.create(createTransactionCategoryDto);
      this.logger.log(`Transaction category created: ${category.categoryCode}`);
      return category;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating transaction category:', error);
      throw error;
    }
  }

  async update(id: string, updateTransactionCategoryDto: UpdateTransactionCategoryDto) {
    try {
      const category = await this.transactionCategoriesRepository.update(id, updateTransactionCategoryDto);
      this.logger.log(`Transaction category updated: ${category.categoryCode}`);
      return category;
    } catch (error) {
      this.logger.error('Error updating transaction category:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const category = await this.transactionCategoriesRepository.softDelete(id);
    this.logger.log(`Transaction category soft deleted: ${category.categoryCode}`);
    return category;
  }

  async restore(id: string) {
    const category = await this.transactionCategoriesRepository.restore(id);
    this.logger.log(`Transaction category restored: ${category.categoryCode}`);
    return category;
  }

  async getByType(categoryType: string) {
    return await this.transactionCategoriesRepository.getByType(categoryType);
  }

  async getActiveCategories() {
    return await this.transactionCategoriesRepository.getActiveCategories();
  }

  async getParentCategories() {
    return await this.transactionCategoriesRepository.getParentCategories();
  }

  async count(where?: any): Promise<number> {
    return await this.transactionCategoriesRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.transactionCategoriesRepository.exists(id);
  }
}
