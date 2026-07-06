"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TransactionCategoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const transaction_categories_repository_1 = require("./transaction-categories.repository");
let TransactionCategoriesService = TransactionCategoriesService_1 = class TransactionCategoriesService {
    constructor(transactionCategoriesRepository) {
        this.transactionCategoriesRepository = transactionCategoriesRepository;
        this.logger = new common_1.Logger(TransactionCategoriesService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'categoryCode', sortOrder = 'asc', search, searchFields, filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (search && searchFields) {
            const fields = searchFields.split(',');
            where.OR = fields.map((field) => ({
                [field]: { contains: search },
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
    async findById(id) {
        return await this.transactionCategoriesRepository.findById(id);
    }
    async create(createTransactionCategoryDto) {
        const existingCategory = await this.transactionCategoriesRepository.findByCategoryCode(createTransactionCategoryDto.categoryCode);
        if (existingCategory) {
            throw new common_1.ConflictException('Category code already exists');
        }
        try {
            const category = await this.transactionCategoriesRepository.create(createTransactionCategoryDto);
            this.logger.log(`Transaction category created: ${category.categoryCode}`);
            return category;
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error('Error creating transaction category:', error);
            throw error;
        }
    }
    async update(id, updateTransactionCategoryDto) {
        try {
            const category = await this.transactionCategoriesRepository.update(id, updateTransactionCategoryDto);
            this.logger.log(`Transaction category updated: ${category.categoryCode}`);
            return category;
        }
        catch (error) {
            this.logger.error('Error updating transaction category:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const category = await this.transactionCategoriesRepository.softDelete(id);
        this.logger.log(`Transaction category soft deleted: ${category.categoryCode}`);
        return category;
    }
    async restore(id) {
        const category = await this.transactionCategoriesRepository.restore(id);
        this.logger.log(`Transaction category restored: ${category.categoryCode}`);
        return category;
    }
    async getByType(categoryType) {
        return await this.transactionCategoriesRepository.getByType(categoryType);
    }
    async getActiveCategories() {
        return await this.transactionCategoriesRepository.getActiveCategories();
    }
    async getParentCategories() {
        return await this.transactionCategoriesRepository.getParentCategories();
    }
    async count(where) {
        return await this.transactionCategoriesRepository.count(where);
    }
    async exists(id) {
        return await this.transactionCategoriesRepository.exists(id);
    }
};
exports.TransactionCategoriesService = TransactionCategoriesService;
exports.TransactionCategoriesService = TransactionCategoriesService = TransactionCategoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transaction_categories_repository_1.TransactionCategoriesRepository])
], TransactionCategoriesService);
//# sourceMappingURL=transaction-categories.service.js.map