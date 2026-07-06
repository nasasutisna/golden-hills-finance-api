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
var CashTransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashTransactionsService = void 0;
const common_1 = require("@nestjs/common");
const cash_transactions_repository_1 = require("./cash-transactions.repository");
const approval_histories_service_1 = require("../approval-histories/approval-histories.service");
const create_approval_history_dto_1 = require("../approval-histories/dto/create-approval-history.dto");
const prisma_service_1 = require("../prisma/prisma.service");
let CashTransactionsService = CashTransactionsService_1 = class CashTransactionsService {
    constructor(cashTransactionsRepository, approvalHistoriesService, prisma) {
        this.cashTransactionsRepository = cashTransactionsRepository;
        this.approvalHistoriesService = approvalHistoriesService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(CashTransactionsService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'transactionDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;
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
        const { transactions, total } = await this.cashTransactionsRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: transactions,
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
        return await this.cashTransactionsRepository.findById(id);
    }
    async create(createCashTransactionDto, user) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber(createCashTransactionDto.transactionType);
            const transaction = await this.cashTransactionsRepository.create({
                ...createCashTransactionDto,
                transactionNumber,
                createdBy: user.id,
                status: createCashTransactionDto.requiresApproval ? 'PENDING' : 'APPROVED',
            }, tx);
            await this.approvalHistoriesService.create({
                entityType: 'CashTransaction',
                entityId: transaction.id,
                action: create_approval_history_dto_1.ApprovalAction.CREATED,
                toStatus: transaction.status,
                createdBy: user.id,
                ipAddress: createCashTransactionDto.ipAddress,
                userAgent: createCashTransactionDto.userAgent,
            });
            this.logger.log(`Cash transaction created: ${transaction.transactionNumber}`);
            return transaction;
        });
    }
    async approveTransaction(id, user) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const transaction = await this.cashTransactionsRepository.findById(id);
            if (transaction.status === 'APPROVED') {
                throw new common_1.ConflictException('Transaction already approved');
            }
            if (transaction.status === 'REJECTED') {
                throw new common_1.ConflictException('Cannot approve rejected transaction');
            }
            const approvedTransaction = await this.cashTransactionsRepository.updateApprovalStatus(id, 'APPROVED', user.id, tx);
            await this.approvalHistoriesService.create({
                entityType: 'CashTransaction',
                entityId: transaction.id,
                action: create_approval_history_dto_1.ApprovalAction.APPROVED,
                fromStatus: transaction.status,
                toStatus: 'APPROVED',
                approvedBy: user.id,
                createdBy: user.id,
            });
            this.logger.log(`Cash transaction approved: ${approvedTransaction.transactionNumber}`);
            return approvedTransaction;
        });
    }
    async rejectTransaction(id, reason, user) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const transaction = await this.cashTransactionsRepository.findById(id);
            if (transaction.status === 'APPROVED') {
                throw new common_1.ConflictException('Cannot reject approved transaction');
            }
            if (transaction.status === 'REJECTED') {
                throw new common_1.ConflictException('Transaction already rejected');
            }
            const rejectedTransaction = await this.cashTransactionsRepository.updateApprovalStatus(id, 'REJECTED', user.id, tx);
            await this.approvalHistoriesService.create({
                entityType: 'CashTransaction',
                entityId: transaction.id,
                action: create_approval_history_dto_1.ApprovalAction.REJECTED,
                fromStatus: transaction.status,
                toStatus: 'REJECTED',
                comments: reason,
                approvedBy: user.id,
                createdBy: user.id,
            });
            this.logger.log(`Cash transaction rejected: ${rejectedTransaction.transactionNumber}`);
            return rejectedTransaction;
        });
    }
    async update(id, updateCashTransactionDto) {
        try {
            const transaction = await this.cashTransactionsRepository.update(id, updateCashTransactionDto);
            this.logger.log(`Cash transaction updated: ${transaction.transactionNumber}`);
            return transaction;
        }
        catch (error) {
            this.logger.error('Error updating cash transaction:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const transaction = await this.cashTransactionsRepository.softDelete(id);
        this.logger.log(`Cash transaction soft deleted: ${transaction.transactionNumber}`);
        return transaction;
    }
    async getByType(transactionType) {
        return await this.cashTransactionsRepository.getByType(transactionType);
    }
    async getByCategory(categoryId) {
        return await this.cashTransactionsRepository.getByCategory(categoryId);
    }
    async getByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return await this.cashTransactionsRepository.getByDateRange(start, end);
    }
    async getByApprovalStatus(status) {
        return await this.cashTransactionsRepository.getByApprovalStatus(status);
    }
    async getTransactionStatistics(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.cashTransactionsRepository.getTransactionStatistics(start, end);
    }
    async count(where) {
        return await this.cashTransactionsRepository.count(where);
    }
    async exists(id) {
        return await this.cashTransactionsRepository.exists(id);
    }
};
exports.CashTransactionsService = CashTransactionsService;
exports.CashTransactionsService = CashTransactionsService = CashTransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cash_transactions_repository_1.CashTransactionsRepository,
        approval_histories_service_1.ApprovalHistoriesService,
        prisma_service_1.PrismaService])
], CashTransactionsService);
//# sourceMappingURL=cash-transactions.service.js.map