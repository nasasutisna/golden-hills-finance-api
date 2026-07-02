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
exports.CashTransactionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CashTransactionsRepository = class CashTransactionsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy, include } = params;
        const [transactions, total] = await Promise.all([
            this.prisma.cashTransaction.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: include || {
                    category: {
                        select: {
                            id: true,
                            categoryCode: true,
                            categoryName: true,
                            categoryType: true,
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    approvals: true,
                },
            }),
            this.prisma.cashTransaction.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { transactions, total };
    }
    async findById(id) {
        const transaction = await this.prisma.cashTransaction.findFirst({
            where: { id, deletedAt: null },
            include: {
                category: true,
                creator: true,
                approvals: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Cash transaction not found');
        }
        return transaction;
    }
    async findByTransactionNumber(transactionNumber) {
        return this.prisma.cashTransaction.findFirst({
            where: { transactionNumber, deletedAt: null },
            include: { category: true, creator: true },
        });
    }
    async create(data, tx) {
        const prisma = tx || this.prisma;
        return prisma.cashTransaction.create({
            data,
            include: { category: true, creator: true },
        });
    }
    async update(id, data, tx) {
        const prisma = tx || this.prisma;
        try {
            return await prisma.cashTransaction.update({
                where: { id },
                data,
                include: { category: true, creator: true },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Cash transaction not found');
            }
            throw error;
        }
    }
    async softDelete(id) {
        return this.update(id, { deletedAt: new Date() });
    }
    async count(where) {
        return this.prisma.cashTransaction.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.cashTransaction.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
    async getByType(transactionType) {
        return this.prisma.cashTransaction.findMany({
            where: { transactionType, deletedAt: null },
            include: { category: true, creator: true },
            orderBy: { transactionDate: 'desc' },
        });
    }
    async getByCategory(categoryId) {
        return this.prisma.cashTransaction.findMany({
            where: { categoryId, deletedAt: null },
            include: { category: true, creator: true },
            orderBy: { transactionDate: 'desc' },
        });
    }
    async getByDateRange(startDate, endDate) {
        return this.prisma.cashTransaction.findMany({
            where: {
                transactionDate: {
                    gte: startDate,
                    lte: endDate,
                },
                deletedAt: null,
            },
            include: { category: true, creator: true },
            orderBy: { transactionDate: 'desc' },
        });
    }
    async getByApprovalStatus(status) {
        return this.prisma.cashTransaction.findMany({
            where: { status, deletedAt: null },
            include: { category: true, creator: true },
            orderBy: { transactionDate: 'desc' },
        });
    }
    async getTransactionStatistics(startDate, endDate) {
        const where = { deletedAt: null };
        if (startDate && endDate) {
            where.transactionDate = { gte: startDate, lte: endDate };
        }
        const [transactions, totalTransactions, pendingApproval] = await Promise.all([
            this.prisma.cashTransaction.findMany({
                where,
                select: { transactionType: true, amount: true },
            }),
            this.prisma.cashTransaction.count({ where }),
            this.prisma.cashTransaction.count({
                where: { ...where, status: 'PENDING' },
            }),
        ]);
        const totalIncome = transactions
            .filter((t) => t.transactionType === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpense = transactions
            .filter((t) => t.transactionType === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
            totalTransactions,
            totalIncome,
            totalExpense,
            netAmount: totalIncome - totalExpense,
            pendingApproval,
        };
    }
    async updateApprovalStatus(transactionId, status, approvedBy, tx) {
        const updateData = { status };
        if (approvedBy) {
            updateData.approvedBy = approvedBy;
            updateData.approvedAt = new Date();
        }
        return this.update(transactionId, updateData, tx);
    }
    async generateTransactionNumber(transactionType) {
        const prefix = transactionType === 'INCOME' ? 'INC' : 'EXP';
        const count = await this.prisma.cashTransaction.count({
            where: { transactionType },
        });
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}${timestamp}${String(count + 1).padStart(4, '0')}`;
    }
};
exports.CashTransactionsRepository = CashTransactionsRepository;
exports.CashTransactionsRepository = CashTransactionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashTransactionsRepository);
//# sourceMappingURL=cash-transactions.repository.js.map