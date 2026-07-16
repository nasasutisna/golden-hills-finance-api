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
const transaction_categories_repository_1 = require("../transaction-categories/transaction-categories.repository");
const approval_histories_service_1 = require("../approval-histories/approval-histories.service");
const create_approval_history_dto_1 = require("../approval-histories/dto/create-approval-history.dto");
const prisma_service_1 = require("../prisma/prisma.service");
const reference_types_1 = require("../common/constants/reference-types");
const cash_transactions_export_1 = require("./cash-transactions.export");
let CashTransactionsService = CashTransactionsService_1 = class CashTransactionsService {
    constructor(cashTransactionsRepository, transactionCategoriesRepository, approvalHistoriesService, prisma) {
        this.cashTransactionsRepository = cashTransactionsRepository;
        this.transactionCategoriesRepository = transactionCategoriesRepository;
        this.approvalHistoriesService = approvalHistoriesService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(CashTransactionsService_1.name);
    }
    async findAll(queryOptions, startDate, endDate) {
        const { page = 1, limit = 10, sortBy = 'transactionDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (startDate || endDate) {
            where.transactionDate = {};
            if (startDate) {
                where.transactionDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.transactionDate.lte = new Date(endDate);
            }
        }
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
    async createFromIplPayment(iplPayment, approvedBy) {
        try {
            const category = await this.transactionCategoriesRepository.findByCategoryCode('IPL-MASUK');
            if (!category) {
                this.logger.warn('IPL-MASUK category not found, skipping cash transaction creation');
                return null;
            }
            const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber('INCOME');
            const transaction = await this.cashTransactionsRepository.create({
                transactionNumber,
                transactionDate: iplPayment.paymentDate,
                transactionType: 'INCOME',
                amount: iplPayment.calculatedAmount,
                categoryId: category.id,
                description: `IPL Payment ${iplPayment.paymentNumber} - ${iplPayment.resident?.firstName || ''} ${iplPayment.resident?.lastName || ''} (Ref: ${iplPayment.referenceNumber})`,
                referenceType: reference_types_1.REFERENCE_TYPES.IPL_PAYMENT,
                referenceId: iplPayment.id,
                status: 'APPROVED',
                approvedBy,
                approvedAt: new Date(),
                createdBy: approvedBy,
            });
            this.logger.log(`Cash transaction created from IPL payment: ${transactionNumber}`);
            return transaction;
        }
        catch (error) {
            this.logger.error(`Failed to create cash transaction from IPL payment:`, error);
            throw error;
        }
    }
    async createFromKegiatanPayment(residentPayment, approvedBy) {
        try {
            const category = await this.transactionCategoriesRepository.findByCategoryCode('KEGIATAN-MASUK');
            if (!category) {
                this.logger.warn('KEGIATAN-MASUK category not found, skipping cash transaction creation');
                return null;
            }
            const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber('INCOME');
            const transaction = await this.cashTransactionsRepository.create({
                transactionNumber,
                transactionDate: residentPayment.paymentDate,
                transactionType: 'INCOME',
                amount: residentPayment.amount,
                categoryId: category.id,
                description: `Iuran Kegiatan Warga - ${residentPayment.resident?.firstName || ''} ${residentPayment.resident?.lastName || ''} (Ref: ${residentPayment.referenceNumber})`,
                referenceType: reference_types_1.REFERENCE_TYPES.KEGIATAN_PAYMENT,
                referenceId: residentPayment.id,
                status: 'APPROVED',
                approvedBy,
                approvedAt: new Date(),
                createdBy: approvedBy,
            });
            this.logger.log(`Cash transaction created from kegiatan payment: ${transactionNumber}`);
            return transaction;
        }
        catch (error) {
            this.logger.error(`Failed to create cash transaction from kegiatan payment:`, error);
            throw error;
        }
    }
    async createFromResidentPayment(residentPayment, verifiedBy) {
        try {
            const category = await this.transactionCategoriesRepository.findByCategoryCode('RESIDENT-MASUK');
            if (!category) {
                this.logger.warn('RESIDENT_PAYMENT-MASUK category not found, skipping cash transaction creation');
                return null;
            }
            const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber('INCOME');
            const transaction = await this.cashTransactionsRepository.create({
                transactionNumber,
                transactionDate: residentPayment.paymentDate,
                transactionType: 'INCOME',
                amount: residentPayment.amount,
                categoryId: category.id,
                description: `Resident Payment ${residentPayment.paymentNumber} - ${residentPayment.resident?.firstName || ''} ${residentPayment.resident?.lastName || ''} (Ref: ${residentPayment.referenceNumber})`,
                referenceType: reference_types_1.REFERENCE_TYPES.RESIDENT_PAYMENT,
                referenceId: residentPayment.id,
                status: 'APPROVED',
                approvedBy: verifiedBy,
                approvedAt: new Date(),
                createdBy: verifiedBy,
            });
            this.logger.log(`Cash transaction created from resident payment: ${transactionNumber}`);
            return transaction;
        }
        catch (error) {
            this.logger.error(`Failed to create cash transaction from resident payment:`, error);
            throw error;
        }
    }
    async getIplReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.cashTransactionsRepository.getIplStatistics(start, end);
    }
    async getKegiatanReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.cashTransactionsRepository.getKegiatanStatistics(start, end);
    }
    async buildReportExport(reportLabel, referenceTypes, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const { transactions, summary, breakdown } = await this.cashTransactionsRepository.getReportData(referenceTypes, start, end);
        const buffer = await (0, cash_transactions_export_1.buildReportWorkbook)({
            title: `Laporan ${reportLabel}`,
            period: { startDate, endDate },
            summary,
            breakdown,
            transactions,
        });
        const stamp = new Date().toISOString().slice(0, 10);
        const filename = `Laporan-${reportLabel}_${startDate || stamp}_${endDate || stamp}.xlsx`;
        return { buffer, filename };
    }
    async exportIplReport(startDate, endDate) {
        return this.buildReportExport('IPL', [reference_types_1.REFERENCE_TYPES.IPL_PAYMENT, reference_types_1.REFERENCE_TYPES.IPL_EXPENSE], startDate, endDate);
    }
    async exportKegiatanReport(startDate, endDate) {
        return this.buildReportExport('Kegiatan', [reference_types_1.REFERENCE_TYPES.KEGIATAN_PAYMENT, reference_types_1.REFERENCE_TYPES.KEGIATAN_EXPENSE], startDate, endDate);
    }
    async getByReferenceType(referenceType, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.cashTransactionsRepository.getByReferenceType(referenceType, start, end);
    }
};
exports.CashTransactionsService = CashTransactionsService;
exports.CashTransactionsService = CashTransactionsService = CashTransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cash_transactions_repository_1.CashTransactionsRepository,
        transaction_categories_repository_1.TransactionCategoriesRepository,
        approval_histories_service_1.ApprovalHistoriesService,
        prisma_service_1.PrismaService])
], CashTransactionsService);
//# sourceMappingURL=cash-transactions.service.js.map