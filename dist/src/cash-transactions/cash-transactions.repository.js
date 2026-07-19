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
                            fundType: true,
                        },
                    },
                    cashAccount: {
                        select: {
                            id: true,
                            accountCode: true,
                            accountName: true,
                            fundType: true,
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
                    approver: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
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
                cashAccount: true,
                creator: true,
                approver: true,
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
            include: { category: true, creator: true, approver: true },
        });
    }
    async create(data, tx) {
        const prisma = tx || this.prisma;
        return prisma.cashTransaction.create({
            data,
            include: { category: true, cashAccount: true, creator: true, approver: true },
        });
    }
    async update(id, data, tx) {
        const prisma = tx || this.prisma;
        try {
            return await prisma.cashTransaction.update({
                where: { id },
                data,
                include: { category: true, cashAccount: true, creator: true, approver: true },
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
            include: { category: true, creator: true, approver: true },
            orderBy: { transactionDate: 'desc' },
        });
    }
    async getByCategory(categoryId) {
        return this.prisma.cashTransaction.findMany({
            where: { categoryId, deletedAt: null },
            include: { category: true, creator: true, approver: true },
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
            include: { category: true, creator: true, approver: true },
            orderBy: { transactionDate: 'desc' },
        });
    }
    async getByApprovalStatus(status) {
        return this.prisma.cashTransaction.findMany({
            where: { status, deletedAt: null },
            include: { category: true, creator: true, approver: true },
            orderBy: { transactionDate: 'desc' },
        });
    }
    baseLedgerWhere(opts = {}) {
        const where = { deletedAt: null };
        if (opts.excludeTransfers) {
            where.isInternalTransfer = false;
        }
        if (opts.cashAccountId) {
            where.cashAccountId = opts.cashAccountId;
        }
        if (opts.categoryId) {
            where.categoryId = opts.categoryId;
        }
        if (opts.startDate && opts.endDate) {
            where.transactionDate = { gte: opts.startDate, lte: opts.endDate };
        }
        return where;
    }
    async getTransactionStatistics(startDate, endDate, categoryId) {
        const where = this.baseLedgerWhere({
            excludeTransfers: true,
            categoryId,
            startDate,
            endDate,
        });
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
    async getByReferenceType(referenceType, startDate, endDate) {
        const where = { referenceType, deletedAt: null };
        if (startDate && endDate) {
            where.transactionDate = { gte: startDate, lte: endDate };
        }
        return this.prisma.cashTransaction.findMany({
            where,
            include: {
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
            },
            orderBy: { transactionDate: 'desc' },
        });
    }
    async getStatisticsByAccount(cashAccountId, startDate, endDate) {
        const where = this.baseLedgerWhere({
            excludeTransfers: true,
            cashAccountId,
            startDate,
            endDate,
        });
        const transactions = await this.prisma.cashTransaction.findMany({
            where,
            include: {
                category: {
                    select: { id: true, categoryCode: true, categoryName: true },
                },
            },
        });
        const income = transactions
            .filter((t) => t.transactionType === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = transactions
            .filter((t) => t.transactionType === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const breakdownByCategory = {};
        for (const t of transactions) {
            if (t.transactionType === 'EXPENSE' && t.category) {
                const name = t.category.categoryName;
                breakdownByCategory[name] = (breakdownByCategory[name] || 0) + Number(t.amount);
            }
        }
        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
            breakdownByCategory,
        };
    }
    async getReportData(cashAccountId, startDate, endDate) {
        const where = this.baseLedgerWhere({
            excludeTransfers: true,
            cashAccountId,
            startDate,
            endDate,
        });
        const rows = await this.prisma.cashTransaction.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        categoryCode: true,
                        categoryName: true,
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
            },
            orderBy: { transactionDate: 'desc' },
        });
        const totalIncome = rows
            .filter((t) => t.transactionType === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpense = rows
            .filter((t) => t.transactionType === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const breakdownMap = new Map();
        for (const t of rows) {
            if (!t.category)
                continue;
            const key = t.category.id;
            const existing = breakdownMap.get(key);
            if (existing) {
                existing.transactionCount += 1;
                existing.totalAmount += Number(t.amount);
            }
            else {
                breakdownMap.set(key, {
                    categoryName: t.category.categoryName,
                    categoryCode: t.category.categoryCode,
                    transactionCount: 1,
                    totalAmount: Number(t.amount),
                });
            }
        }
        const transactions = rows.map((t) => ({
            transactionNumber: t.transactionNumber,
            transactionDate: t.transactionDate,
            transactionType: t.transactionType,
            amount: Number(t.amount),
            description: t.description,
            referenceType: t.referenceType,
            status: t.status,
            category: t.category
                ? {
                    categoryName: t.category.categoryName,
                    categoryCode: t.category.categoryCode,
                }
                : null,
            creator: t.creator
                ? {
                    firstName: t.creator.firstName,
                    lastName: t.creator.lastName,
                    username: t.creator.username,
                }
                : null,
        }));
        return {
            transactions,
            summary: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
            },
            breakdown: Array.from(breakdownMap.values()),
        };
    }
    async getCashAccounts() {
        return this.prisma.cashAccount.findMany({
            where: { deletedAt: null },
            orderBy: { accountCode: 'asc' },
        });
    }
    async findCashAccountByCode(accountCode) {
        return this.prisma.cashAccount.findFirst({
            where: { accountCode, deletedAt: null },
        });
    }
    async getAccountBalances(startDate, endDate) {
        const accounts = await this.getCashAccounts();
        const sumByAccount = async (dateFilter) => {
            const rows = await this.prisma.cashTransaction.findMany({
                where: { deletedAt: null, ...(dateFilter ?? {}) },
                select: { cashAccountId: true, transactionType: true, amount: true },
            });
            const map = new Map();
            for (const t of rows) {
                if (!t.cashAccountId)
                    continue;
                const acc = map.get(t.cashAccountId) ?? { income: 0, expense: 0 };
                if (t.transactionType === 'INCOME')
                    acc.income += Number(t.amount);
                else if (t.transactionType === 'EXPENSE')
                    acc.expense += Number(t.amount);
                map.set(t.cashAccountId, acc);
            }
            return map;
        };
        const allByAccount = await sumByAccount();
        const periodByAccount = startDate && endDate ? await sumByAccount({ transactionDate: { gte: startDate, lte: endDate } }) : null;
        return accounts.map((a) => {
            const all = allByAccount.get(a.id) ?? { income: 0, expense: 0 };
            const period = periodByAccount?.get(a.id) ?? { income: 0, expense: 0 };
            return {
                id: a.id,
                accountCode: a.accountCode,
                accountName: a.accountName,
                fundType: a.fundType,
                openingBalance: Number(a.openingBalance),
                balance: Number(a.openingBalance) + all.income - all.expense,
                periodIncome: period.income,
                periodExpense: period.expense,
                periodBalance: period.income - period.expense,
                isActive: a.isActive,
            };
        });
    }
    async generateTransferGroupId() {
        const count = await this.prisma.cashTransaction.count({
            where: { transferGroupId: { not: null } },
        });
        const timestamp = Date.now().toString().slice(-8);
        return `TRF${timestamp}${String(count + 1).padStart(4, '0')}`;
    }
    async softDeleteByTransferGroup(transferGroupId, tx) {
        const prisma = tx || this.prisma;
        const result = await prisma.cashTransaction.updateMany({
            where: { transferGroupId, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        return result.count;
    }
};
exports.CashTransactionsRepository = CashTransactionsRepository;
exports.CashTransactionsRepository = CashTransactionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashTransactionsRepository);
//# sourceMappingURL=cash-transactions.repository.js.map