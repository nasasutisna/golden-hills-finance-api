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
exports.ResidentInvoicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const resident_invoices_service_1 = require("./resident-invoices.service");
const create_resident_invoice_dto_1 = require("./dto/create-resident-invoice.dto");
const update_resident_invoice_dto_1 = require("./dto/update-resident-invoice.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let ResidentInvoicesController = class ResidentInvoicesController {
    constructor(residentInvoicesService) {
        this.residentInvoicesService = residentInvoicesService;
    }
    async create(createResidentInvoiceDto) {
        const invoice = await this.residentInvoicesService.create(createResidentInvoiceDto);
        return {
            statusCode: 201,
            message: 'Invoice created successfully',
            data: invoice,
        };
    }
    async findAll(queryOptions) {
        const result = await this.residentInvoicesService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Invoices retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getStatistics(residentId) {
        const stats = await this.residentInvoicesService.getInvoiceStatistics(residentId);
        return {
            statusCode: 200,
            message: 'Invoice statistics retrieved successfully',
            data: stats,
        };
    }
    async getOverdue() {
        const invoices = await this.residentInvoicesService.getOverdueInvoices();
        return {
            statusCode: 200,
            message: 'Overdue invoices retrieved successfully',
            data: invoices,
        };
    }
    async getByResident(residentId) {
        const invoices = await this.residentInvoicesService.getByResident(residentId);
        return {
            statusCode: 200,
            message: 'Invoices retrieved successfully',
            data: invoices,
        };
    }
    async getByStatus(status) {
        const invoices = await this.residentInvoicesService.getByStatus(status);
        return {
            statusCode: 200,
            message: 'Invoices retrieved successfully',
            data: invoices,
        };
    }
    async findOne(id) {
        const invoice = await this.residentInvoicesService.findById(id);
        return {
            statusCode: 200,
            message: 'Invoice retrieved successfully',
            data: invoice,
        };
    }
    async update(id, updateResidentInvoiceDto) {
        const invoice = await this.residentInvoicesService.update(id, updateResidentInvoiceDto);
        return {
            statusCode: 200,
            message: 'Invoice updated successfully',
            data: invoice,
        };
    }
    async markAsPaid(id) {
        const invoice = await this.residentInvoicesService.markAsPaid(id);
        return {
            statusCode: 200,
            message: 'Invoice marked as paid successfully',
            data: invoice,
        };
    }
    async markAsOverdue(id) {
        const invoice = await this.residentInvoicesService.markAsOverdue(id);
        return {
            statusCode: 200,
            message: 'Invoice marked as overdue successfully',
            data: invoice,
        };
    }
    async cancel(id, reason) {
        const invoice = await this.residentInvoicesService.cancelInvoice(id, reason);
        return {
            statusCode: 200,
            message: 'Invoice cancelled successfully',
            data: invoice,
        };
    }
    async remove(id) {
        const invoice = await this.residentInvoicesService.softDelete(id);
        return {
            statusCode: 200,
            message: 'Invoice deleted successfully',
            data: invoice,
        };
    }
};
exports.ResidentInvoicesController = ResidentInvoicesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new invoice',
        description: 'Create a new resident invoice',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resident_invoice_dto_1.CreateResidentInvoiceDto]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all invoices',
        description: 'Get paginated list of resident invoices',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get invoice statistics',
        description: 'Get invoice statistics and totals',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)('residentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('overdue'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get overdue invoices',
        description: 'Get all overdue invoices',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "getOverdue", null);
__decorate([
    (0, common_1.Get)('resident/:residentId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get invoices by resident',
        description: 'Get all invoices for a specific resident',
    }),
    (0, swagger_1.ApiParam)({ name: 'residentId', description: 'Resident ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('residentId', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "getByResident", null);
__decorate([
    (0, common_1.Get)('status/:status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get invoices by status',
        description: 'Get all invoices with specific status',
    }),
    (0, swagger_1.ApiParam)({ name: 'status', description: 'Invoice status' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "getByStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get invoice by ID',
        description: 'Get invoice information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update invoice',
        description: 'Update invoice information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resident_invoice_dto_1.UpdateResidentInvoiceDto]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/mark-paid'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mark invoice as paid',
        description: 'Mark invoice as paid',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "markAsPaid", null);
__decorate([
    (0, common_1.Patch)(':id/mark-overdue'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mark invoice as overdue',
        description: 'Mark invoice as overdue',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "markAsOverdue", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel invoice',
        description: 'Cancel an invoice',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete invoice',
        description: 'Soft delete invoice',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentInvoicesController.prototype, "remove", null);
exports.ResidentInvoicesController = ResidentInvoicesController = __decorate([
    (0, swagger_1.ApiTags)('Resident Invoices'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('resident-invoices'),
    __metadata("design:paramtypes", [resident_invoices_service_1.ResidentInvoicesService])
], ResidentInvoicesController);
//# sourceMappingURL=resident-invoices.controller.js.map