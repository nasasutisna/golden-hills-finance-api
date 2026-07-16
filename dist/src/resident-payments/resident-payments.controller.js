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
exports.ResidentPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const resident_payments_service_1 = require("./resident-payments.service");
const resident_payment_receipts_service_1 = require("./resident-payment-receipts.service");
const file_attachments_service_1 = require("../file-attachments/file-attachments.service");
const create_resident_payment_dto_1 = require("./dto/create-resident-payment.dto");
const create_resident_payment_dto_2 = require("./dto/create-resident-payment.dto");
const update_resident_payment_dto_1 = require("./dto/update-resident-payment.dto");
const create_bulk_resident_payment_dto_1 = require("./dto/create-bulk-resident-payment.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
const PROOF_REQUIRED_METHODS = [
    create_resident_payment_dto_2.PaymentMethod.TRANSFER,
    create_resident_payment_dto_2.PaymentMethod.E_WALLET,
    create_resident_payment_dto_2.PaymentMethod.CARD,
];
let ResidentPaymentsController = class ResidentPaymentsController {
    constructor(residentPaymentsService, fileAttachmentsService, residentPaymentReceiptsService) {
        this.residentPaymentsService = residentPaymentsService;
        this.fileAttachmentsService = fileAttachmentsService;
        this.residentPaymentReceiptsService = residentPaymentReceiptsService;
    }
    async create(proofFile, userId, createResidentPaymentDto) {
        if (PROOF_REQUIRED_METHODS.includes(createResidentPaymentDto.paymentMethod) && !proofFile) {
            throw new common_1.BadRequestException(`Bukti transfer wajib diupload untuk metode pembayaran ${createResidentPaymentDto.paymentMethod}`);
        }
        let proofFileId;
        if (proofFile) {
            const fileAttachment = await this.fileAttachmentsService.create({
                entityType: 'ResidentPayment',
                fileName: proofFile.originalname,
                filePath: `/uploads/temp/${proofFile.filename}`,
                fileSize: proofFile.size,
                mimeType: proofFile.mimetype,
                category: 'PAYMENT_PROOF',
                description: 'Bukti pembayaran warga',
            }, userId);
            proofFileId = fileAttachment.id;
        }
        const payment = await this.residentPaymentsService.create(userId, createResidentPaymentDto, proofFileId);
        return {
            statusCode: 201,
            message: 'Payment created successfully',
            data: payment,
        };
    }
    async createBulk(createBulkDto) {
        const result = await this.residentPaymentsService.createBulk(createBulkDto);
        if (result.failureCount > 0) {
            return {
                statusCode: 207,
                message: `Bulk payment processed: ${result.successCount} successful, ${result.failureCount} failed`,
                data: result,
            };
        }
        return {
            statusCode: 201,
            message: 'All payments created successfully',
            data: result,
        };
    }
    async findAll(queryOptions) {
        const result = await this.residentPaymentsService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Payments retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getStatistics(residentId) {
        const stats = await this.residentPaymentsService.getPaymentStatistics(residentId);
        return {
            statusCode: 200,
            message: 'Payment statistics retrieved successfully',
            data: stats,
        };
    }
    async getByResident(residentId) {
        const payments = await this.residentPaymentsService.getByResident(residentId);
        return {
            statusCode: 200,
            message: 'Payments retrieved successfully',
            data: payments,
        };
    }
    async getByInvoice(invoiceId) {
        const payments = await this.residentPaymentsService.getByInvoice(invoiceId);
        return {
            statusCode: 200,
            message: 'Payments retrieved successfully',
            data: payments,
        };
    }
    async findOne(id) {
        const payment = await this.residentPaymentsService.findById(id);
        return {
            statusCode: 200,
            message: 'Payment retrieved successfully',
            data: payment,
        };
    }
    async getReceipt(id) {
        const receipt = await this.residentPaymentReceiptsService.getReceiptInfo(id);
        return {
            statusCode: 200,
            message: 'Receipt retrieved successfully',
            data: { ...receipt, url: receipt.filePath },
        };
    }
    async update(id, updateResidentPaymentDto) {
        const payment = await this.residentPaymentsService.update(id, updateResidentPaymentDto);
        return {
            statusCode: 200,
            message: 'Payment updated successfully',
            data: payment,
        };
    }
    async verifyPayment(id, user) {
        const payment = await this.residentPaymentsService.verifyPayment(id, user.id);
        return {
            statusCode: 200,
            message: 'Payment verified successfully',
            data: payment,
        };
    }
    async remove(id) {
        const payment = await this.residentPaymentsService.softDelete(id);
        return {
            statusCode: 200,
            message: 'Payment deleted successfully',
            data: payment,
        };
    }
};
exports.ResidentPaymentsController = ResidentPaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('proofFile')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new payment',
        description: 'Create a new resident payment. Bukti transfer wajib untuk metode TRANSFER/E_WALLET/CARD (opsional untuk CASH). invoiceId opsional.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                residentId: { type: 'string', example: 'uuid-of-resident' },
                invoiceId: { type: 'string', example: 'uuid-of-invoice', description: 'Opsional' },
                paymentDate: { type: 'string', example: '2026-07-16' },
                paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER', 'CARD', 'E_WALLET'] },
                paymentChannel: { type: 'string', example: 'BCA' },
                referenceNumber: { type: 'string', example: 'REF123456789' },
                amount: { type: 'number', example: 500000 },
                bankName: { type: 'string', example: 'BCA' },
                accountNumber: { type: 'string', example: '1234567890' },
                notes: { type: 'string' },
                proofFile: { type: 'string', format: 'binary', description: 'Bukti transfer (wajib untuk non-tunai)' },
            },
            required: ['residentId', 'paymentDate', 'paymentMethod', 'amount'],
        },
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_resident_payment_dto_1.CreateResidentPaymentDto]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create bulk payments',
        description: 'Create multiple resident payments in a single transaction',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bulk_resident_payment_dto_1.CreateBulkResidentPaymentDto]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all payments',
        description: 'Get paginated list of resident payments',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get payment statistics',
        description: 'Get payment statistics and totals',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)('residentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('resident/:residentId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get payments by resident',
        description: 'Get all payments for a specific resident',
    }),
    (0, swagger_1.ApiParam)({ name: 'residentId', description: 'Resident ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('residentId', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "getByResident", null);
__decorate([
    (0, common_1.Get)('invoice/:invoiceId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get payments by invoice',
        description: 'Get all payments for a specific invoice',
    }),
    (0, swagger_1.ApiParam)({ name: 'invoiceId', description: 'Invoice ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('invoiceId', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "getByInvoice", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get payment by ID',
        description: 'Get payment information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Payment ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/receipt'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get resident payment receipt (PDF)',
        description: 'Generate or retrieve the receipt for a verified resident payment. Returns file info with URL.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Payment ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "getReceipt", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update payment',
        description: 'Update payment information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Payment ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resident_payment_dto_1.UpdateResidentPaymentDto]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/verify'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify payment',
        description: 'Verify and complete payment',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Payment ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete payment',
        description: 'Soft delete payment',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Payment ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "remove", null);
exports.ResidentPaymentsController = ResidentPaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Resident Payments'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('resident-payments'),
    __metadata("design:paramtypes", [resident_payments_service_1.ResidentPaymentsService,
        file_attachments_service_1.FileAttachmentsService,
        resident_payment_receipts_service_1.ResidentPaymentReceiptsService])
], ResidentPaymentsController);
//# sourceMappingURL=resident-payments.controller.js.map