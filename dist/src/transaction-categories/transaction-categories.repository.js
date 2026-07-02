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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCategoriesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionCategoriesRepository = class TransactionCategoriesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [categories, total] = await Promise.all([
            this.prisma.transactionCategory.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: {},
            }),
            this.prisma.transactionCategory.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { categories, total };
    }
    async findById(id) {
        const category = await this.prisma.transactionCategory.findFirst({
            where: { id, deletedAt: null },
            include: {},
        });
        if (!category) {
            throw new common_1.NotFoundException('Transaction category not found');
        }
        return category;
    }
    async findByCategoryCode(categoryCode) {
        return this.prisma.transactionCategory.findFirst({
            where: { categoryCode, deletedAt: null },
            include: {},
        });
    }
    async create(data) {
        return this.prisma.transactionCategory.create({
            data,
            include: {},
        });
    }
    async update(id, data) {
        try {
            return await this.prisma.transactionCategory.update({
                where: { id },
                data,
                include: {},
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Transaction category not found');
            }
            throw error;
        }
    }
    async softDelete(id) {
        return this.update(id, {
            deletedAt: new Date(),
            isActive: false,
        });
    }
    async restore(id) {
        return this.prisma.transactionCategory.update({
            where: { id },
            data: { deletedAt: null, isActive: true },
            include: {},
        });
    }
    async count(where) {
        return this.prisma.transactionCategory.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.transactionCategory.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
    async getByType(categoryType) {
        return this.prisma.transactionCategory.findMany({
            where: { categoryType, deletedAt: null },
            include: {},
            orderBy: { categoryName: 'asc' },
        });
    }
    async getActiveCategories() {
        return this.prisma.transactionCategory.findMany({
            where: { isActive: true, deletedAt: null },
            include: {},
            orderBy: [{ categoryType: 'asc' }, { categoryName: 'asc' }],
        });
    }
    async getParentCategories() {
        return this.prisma.transactionCategory.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: { categoryName: 'asc' },
        });
    }
};
exports.TransactionCategoriesRepository = TransactionCategoriesRepository;
exports.TransactionCategoriesRepository = TransactionCategoriesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionCategoriesRepository);
//# sourceMappingURL=transaction-categories.repository.js.map