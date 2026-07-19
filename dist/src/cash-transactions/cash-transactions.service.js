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
const cash_accounts_1 = require("../common/constants/cash-accounts");
const cash_transactions_export_1 = require("./cash-transactions.export");
let CashTransactionsService = CashTransactionsService_1 = class CashTransactionsService {
    constructor(cashTransactionsRepository, transactionCategoriesRepository, approvalHistoriesService, prisma) {
        this.cashTransactionsRepository = cashTransactionsRepository;
        this.transactionCategoriesRepository = transactionCategoriesRepository;
        this.approvalHistoriesService = approvalHistoriesService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(CashTransactionsService_1.name);
    }
    async findAll(queryOptions, startDate, endDate, categoryId, cashAccountId) {
        const { page = 1, limit = 10, sortBy = 'transactionDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (cashAccountId) {
            where.cashAccountId = cashAccountId;
        }
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
    async resolveCashAccountId(categoryId, tx) {
        if (!categoryId) {
            throw new common_1.BadRequestException('Category is required to determine the cash account (Kas)');
        }
        const client = tx || this.prisma;
        const category = await client.transactionCategory.findFirst({
            where: { id: categoryId, deletedAt: null },
            select: { id: true, categoryCode: true, fundType: true },
        });
        if (!category) {
            throw new common_1.BadRequestException(`Transaction category ${categoryId} not found`);
        }
        const accountId = (0, cash_accounts_1.accountIdForFund)(category.fundType);
        if (!accountId) {
            throw new common_1.BadRequestException(`Category "${category.categoryCode}" has no fundType; cannot determine Kas. Tag the category fundType (IPL/WARGA).`);
        }
        return accountId;
    }
    async create(createCashTransactionDto, user) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const cashAccountId = await this.resolveCashAccountId(createCashTransactionDto.categoryId, tx);
            const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber(createCashTransactionDto.transactionType);
            const transaction = await this.cashTransactionsRepository.create({
                ...createCashTransactionDto,
                transactionNumber,
                cashAccountId,
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
    async createFromExpenseRequest(request, approvedBy, tx) {
        let categoryId = request.categoryId;
        if (!categoryId) {
            const defaultCategory = await this.transactionCategoriesRepository.findByCategoryCode('PENGELUARAN-WARGA');
            if (!defaultCategory) {
                throw new common_1.BadRequestException("Default expense category 'PENGELUARAN-WARGA' not found. Please seed it.");
            }
            categoryId = defaultCategory.id;
        }
        const transactionNumber = await this.cashTransactionsRepository.generateTransactionNumber('EXPENSE');
        const description = `Pengeluaran ${request.requestNumber} - ${request.title}`;
        const cashAccountId = await this.resolveCashAccountId(categoryId, tx);
        const cashTx = await this.cashTransactionsRepository.create({
            transactionNumber,
            transactionDate: request.transactionDate,
            transactionType: 'EXPENSE',
            amount: request.amount,
            categoryId,
            cashAccountId,
            description,
            referenceType: reference_types_1.REFERENCE_TYPES.EXPENSE_REQUEST,
            referenceId: request.id,
            status: 'APPROVED',
            approvedBy,
            approvedAt: new Date(),
            createdBy: approvedBy,
        }, tx);
        this.logger.log(`Cash transaction ${cashTx.transactionNumber} created from expense request ${request.requestNumber}`);
        return cashTx;
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
        const existing = await this.cashTransactionsRepository.findById(id);
        if (existing.transferGroupId) {
            const count = await this.prisma.executeInTransaction(async (tx) => {
                return this.cashTransactionsRepository.softDeleteByTransferGroup(existing.transferGroupId, tx);
            });
            this.logger.log(`Transfer group ${existing.transferGroupId} soft deleted (${count} legs)`);
            return existing;
        }
        const transaction = await this.cashTransactionsRepository.softDelete(id);
        this.logger.log(`Cash transaction soft deleted: ${transaction.transactionNumber}`);
        return transaction;
    }
    async transfer(dto, user) {
        if (dto.fromAccountCode === dto.toAccountCode) {
            throw new common_1.BadRequestException('Source and destination account must differ');
        }
        if (!dto.amount || dto.amount <= 0) {
            throw new common_1.BadRequestException('Transfer amount must be greater than 0');
        }
        const [fromAccount, toAccount] = await Promise.all([
            this.cashTransactionsRepository.findCashAccountByCode(dto.fromAccountCode),
            this.cashTransactionsRepository.findCashAccountByCode(dto.toAccountCode),
        ]);
        if (!fromAccount || !fromAccount.isActive) {
            throw new common_1.BadRequestException(`Source account ${dto.fromAccountCode} not found or inactive`);
        }
        if (!toAccount || !toAccount.isActive) {
            throw new common_1.BadRequestException(`Destination account ${dto.toAccountCode} not found or inactive`);
        }
        const transactionDate = new Date(dto.transactionDate);
        const description = dto.description?.trim() ||
            `Transfer ${fromAccount.accountName} → ${toAccount.accountName}`;
        return await this.prisma.executeInTransaction(async (tx) => {
            const transferGroupId = await this.cashTransactionsRepository.generateTransferGroupId();
            const expenseNo = await this.cashTransactionsRepository.generateTransactionNumber('EXPENSE');
            const incomeNo = await this.cashTransactionsRepository.generateTransactionNumber('INCOME');
            const common = {
                amount: dto.amount,
                transactionDate,
                description,
                referenceType: reference_types_1.REFERENCE_TYPES.INTERNAL_TRANSFER,
                isInternalTransfer: true,
                transferGroupId,
                status: 'APPROVED',
                approvedBy: user.id,
                approvedAt: new Date(),
                createdBy: user.id,
            };
            const outLeg = await this.cashTransactionsRepository.create({
                transactionNumber: expenseNo,
                transactionType: 'EXPENSE',
                cashAccountId: fromAccount.id,
                ...common,
            }, tx);
            const inLeg = await this.cashTransactionsRepository.create({
                transactionNumber: incomeNo,
                transactionType: 'INCOME',
                cashAccountId: toAccount.id,
                ...common,
            }, tx);
            this.logger.log(`Transfer ${transferGroupId}: ${fromAccount.accountCode} → ${toAccount.accountCode} @ ${dto.amount}`);
            return { transferGroupId, fromAccount, toAccount, legs: [outLeg, inLeg] };
        });
    }
    async getCashAccounts() {
        return this.cashTransactionsRepository.getCashAccounts();
    }
    async getAccountBalances(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.cashTransactionsRepository.getAccountBalances(start, end);
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
    async getTransactionStatistics(startDate, endDate, categoryId) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.cashTransactionsRepository.getTransactionStatistics(start, end, categoryId);
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
                cashAccountId: (0, cash_accounts_1.accountIdForFund)(category.fundType) ?? cash_accounts_1.CASH_ACCOUNT_IDS.KAS_IPL,
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
                cashAccountId: (0, cash_accounts_1.accountIdForFund)(category.fundType) ?? cash_accounts_1.CASH_ACCOUNT_IDS.KAS_WARGA,
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
                cashAccountId: (0, cash_accounts_1.accountIdForFund)(category.fundType) ?? cash_accounts_1.CASH_ACCOUNT_IDS.KAS_WARGA,
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
        return await this.cashTransactionsRepository.getStatisticsByAccount(cash_accounts_1.CASH_ACCOUNT_IDS.KAS_IPL, start, end);
    }
    async getKegiatanReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.cashTransactionsRepository.getStatisticsByAccount(cash_accounts_1.CASH_ACCOUNT_IDS.KAS_WARGA, start, end);
    }
    async buildReportExport(reportLabel, cashAccountId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const { transactions, summary, breakdown } = await this.cashTransactionsRepository.getReportData(cashAccountId, start, end);
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
        return this.buildReportExport('IPL', cash_accounts_1.CASH_ACCOUNT_IDS.KAS_IPL, startDate, endDate);
    }
    async exportKegiatanReport(startDate, endDate) {
        return this.buildReportExport('Kegiatan', cash_accounts_1.CASH_ACCOUNT_IDS.KAS_WARGA, startDate, endDate);
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