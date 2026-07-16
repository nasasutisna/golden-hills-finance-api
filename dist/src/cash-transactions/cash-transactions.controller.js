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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashTransactionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cash_transactions_service_1 = require("./cash-transactions.service");
const create_cash_transaction_dto_1 = require("./dto/create-cash-transaction.dto");
const update_cash_transaction_dto_1 = require("./dto/update-cash-transaction.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let CashTransactionsController = class CashTransactionsController {
    constructor(cashTransactionsService) {
        this.cashTransactionsService = cashTransactionsService;
    }
    async create(createCashTransactionDto, user) {
        const transaction = await this.cashTransactionsService.create(createCashTransactionDto, user);
        return {
            statusCode: 201,
            message: 'Cash transaction created successfully',
            data: transaction,
        };
    }
    async findAll(queryOptions, startDate, endDate) {
        const result = await this.cashTransactionsService.findAll(queryOptions, startDate, endDate);
        return {
            statusCode: 200,
            message: 'Cash transactions retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getSummary(startDate, endDate) {
        const stats = await this.cashTransactionsService.getTransactionStatistics(startDate, endDate);
        return {
            statusCode: 200,
            message: 'Cash transactions summary retrieved successfully',
            data: stats,
        };
    }
    async getStatistics(startDate, endDate) {
        const stats = await this.cashTransactionsService.getTransactionStatistics(startDate, endDate);
        return {
            statusCode: 200,
            message: 'Transaction statistics retrieved successfully',
            data: stats,
        };
    }
    async getByType(transactionType) {
        const transactions = await this.cashTransactionsService.getByType(transactionType);
        return {
            statusCode: 200,
            message: 'Transactions retrieved successfully',
            data: transactions,
        };
    }
    async getByCategory(categoryId) {
        const transactions = await this.cashTransactionsService.getByCategory(categoryId);
        return {
            statusCode: 200,
            message: 'Transactions retrieved successfully',
            data: transactions,
        };
    }
    async getByDateRange(startDate, endDate) {
        const transactions = await this.cashTransactionsService.getByDateRange(startDate, endDate);
        return {
            statusCode: 200,
            message: 'Transactions retrieved successfully',
            data: transactions,
        };
    }
    async getByApprovalStatus(approvalStatus) {
        const transactions = await this.cashTransactionsService.getByApprovalStatus(approvalStatus);
        return {
            statusCode: 200,
            message: 'Transactions retrieved successfully',
            data: transactions,
        };
    }
    async findOne(id) {
        const transaction = await this.cashTransactionsService.findById(id);
        return {
            statusCode: 200,
            message: 'Cash transaction retrieved successfully',
            data: transaction,
        };
    }
    async update(id, updateCashTransactionDto) {
        const transaction = await this.cashTransactionsService.update(id, updateCashTransactionDto);
        return {
            statusCode: 200,
            message: 'Cash transaction updated successfully',
            data: transaction,
        };
    }
    async approveTransaction(id, user) {
        const transaction = await this.cashTransactionsService.approveTransaction(id, user);
        return {
            statusCode: 200,
            message: 'Transaction approved successfully',
            data: transaction,
        };
    }
    async rejectTransaction(id, reason, user) {
        const transaction = await this.cashTransactionsService.rejectTransaction(id, reason, user);
        return {
            statusCode: 200,
            message: 'Transaction rejected successfully',
            data: transaction,
        };
    }
    async remove(id) {
        const transaction = await this.cashTransactionsService.softDelete(id);
        return {
            statusCode: 200,
            message: 'Cash transaction deleted successfully',
            data: transaction,
        };
    }
    async getIplReport(startDate, endDate) {
        const data = await this.cashTransactionsService.getIplReport(startDate, endDate);
        return {
            statusCode: 200,
            message: 'IPL report retrieved successfully',
            data,
        };
    }
    async getKegiatanReport(startDate, endDate) {
        const data = await this.cashTransactionsService.getKegiatanReport(startDate, endDate);
        return {
            statusCode: 200,
            message: 'Kegiatan report retrieved successfully',
            data,
        };
    }
    async exportIplReport(res, startDate, endDate) {
        const { buffer, filename } = await this.cashTransactionsService.exportIplReport(startDate, endDate);
        res.header({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        res.send(buffer);
    }
    async exportKegiatanReport(res, startDate, endDate) {
        const { buffer, filename } = await this.cashTransactionsService.exportKegiatanReport(startDate, endDate);
        res.header({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        res.send(buffer);
    }
    async getByReferenceType(referenceType, startDate, endDate) {
        const transactions = await this.cashTransactionsService.getByReferenceType(referenceType, startDate, endDate);
        return {
            statusCode: 200,
            message: 'Transactions retrieved successfully',
            data: transactions,
        };
    }
};
exports.CashTransactionsController = CashTransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new cash transaction',
        description: 'Create a new cash transaction',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cash_transaction_dto_1.CreateCashTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all cash transactions',
        description: 'Get paginated list of cash transactions with optional date range filter',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto, String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get cash transactions summary',
        description: 'Get cash transactions summary including income, expenses, and pending approvals',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transaction statistics',
        description: 'Get cash transaction statistics and totals',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('type/:transactionType'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transactions by type',
        description: 'Get transactions by type (INCOME/EXPENSE)',
    }),
    (0, swagger_1.ApiParam)({ name: 'transactionType', description: 'Transaction type' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('transactionType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getByType", null);
__decorate([
    (0, common_1.Get)('category/:categoryId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transactions by category',
        description: 'Get transactions by category',
    }),
    (0, swagger_1.ApiParam)({ name: 'categoryId', description: 'Category ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('categoryId', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getByCategory", null);
__decorate([
    (0, common_1.Get)('date-range'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transactions by date range',
        description: 'Get transactions within a date range',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getByDateRange", null);
__decorate([
    (0, common_1.Get)('approval-status/:approvalStatus'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transactions by approval status',
        description: 'Get transactions by approval status',
    }),
    (0, swagger_1.ApiParam)({ name: 'approvalStatus', description: 'Approval status' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('approvalStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getByApprovalStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get cash transaction by ID',
        description: 'Get cash transaction information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Cash Transaction ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update cash transaction',
        description: 'Update cash transaction information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Cash Transaction ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_cash_transaction_dto_1.UpdateCashTransactionDto]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Approve transaction',
        description: 'Approve a pending cash transaction',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Cash Transaction ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "approveTransaction", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reject transaction',
        description: 'Reject a pending cash transaction',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Cash Transaction ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "rejectTransaction", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete cash transaction',
        description: 'Soft delete cash transaction',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Cash Transaction ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('reports/ipl'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get IPL financial report',
        description: 'Get IPL-specific income, expenses, and balance',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getIplReport", null);
__decorate([
    (0, common_1.Get)('reports/kegiatan'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Kegiatan financial report',
        description: 'Get Kegiatan-specific income, expenses, and balance',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getKegiatanReport", null);
__decorate([
    (0, common_1.Get)('reports/ipl/export'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export IPL report to Excel',
        description: 'Download the IPL financial report as an .xlsx file',
    }),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "exportIplReport", null);
__decorate([
    (0, common_1.Get)('reports/kegiatan/export'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export Kegiatan report to Excel',
        description: 'Download the Kegiatan financial report as an .xlsx file',
    }),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "exportKegiatanReport", null);
__decorate([
    (0, common_1.Get)('reference/:referenceType'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transactions by reference type',
        description: 'Get transactions filtered by reference type (e.g., IPL_PAYMENT, KEGIATAN_EXPENSE)',
    }),
    (0, swagger_1.ApiParam)({ name: 'referenceType', description: 'Reference type filter' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('referenceType')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CashTransactionsController.prototype, "getByReferenceType", null);
exports.CashTransactionsController = CashTransactionsController = __decorate([
    (0, swagger_1.ApiTags)('Cash Transactions'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('cash-transactions'),
    __metadata("design:paramtypes", [cash_transactions_service_1.CashTransactionsService])
], CashTransactionsController);
//# sourceMappingURL=cash-transactions.controller.js.map