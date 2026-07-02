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
const resident_payments_service_1 = require("./resident-payments.service");
const create_resident_payment_dto_1 = require("./dto/create-resident-payment.dto");
const update_resident_payment_dto_1 = require("./dto/update-resident-payment.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let ResidentPaymentsController = class ResidentPaymentsController {
    constructor(residentPaymentsService) {
        this.residentPaymentsService = residentPaymentsService;
    }
    async create(createResidentPaymentDto) {
        const payment = await this.residentPaymentsService.create(createResidentPaymentDto);
        return {
            statusCode: 201,
            message: 'Payment created successfully',
            data: payment,
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
    (0, swagger_1.ApiOperation)({
        summary: 'Create new payment',
        description: 'Create a new resident payment',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resident_payment_dto_1.CreateResidentPaymentDto]),
    __metadata("design:returntype", Promise)
], ResidentPaymentsController.prototype, "create", null);
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
    __metadata("design:paramtypes", [resident_payments_service_1.ResidentPaymentsService])
], ResidentPaymentsController);
//# sourceMappingURL=resident-payments.controller.js.map