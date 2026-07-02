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
exports.FeeTypesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fee_types_service_1 = require("./fee-types.service");
const create_fee_type_dto_1 = require("./dto/create-fee-type.dto");
const update_fee_type_dto_1 = require("./dto/update-fee-type.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let FeeTypesController = class FeeTypesController {
    constructor(feeTypesService) {
        this.feeTypesService = feeTypesService;
    }
    async create(createFeeTypeDto) {
        const feeType = await this.feeTypesService.create(createFeeTypeDto);
        return {
            statusCode: 201,
            message: 'Fee type created successfully',
            data: feeType,
        };
    }
    async findAll(queryOptions) {
        const result = await this.feeTypesService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Fee types retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getActive() {
        const feeTypes = await this.feeTypesService.getActiveFeeTypes();
        return {
            statusCode: 200,
            message: 'Active fee types retrieved successfully',
            data: feeTypes,
        };
    }
    async getByCategory(category) {
        const feeTypes = await this.feeTypesService.getByCategory(category);
        return {
            statusCode: 200,
            message: 'Fee types retrieved successfully',
            data: feeTypes,
        };
    }
    async findOne(id) {
        const feeType = await this.feeTypesService.findById(id);
        return {
            statusCode: 200,
            message: 'Fee type retrieved successfully',
            data: feeType,
        };
    }
    async update(id, updateFeeTypeDto) {
        const feeType = await this.feeTypesService.update(id, updateFeeTypeDto);
        return {
            statusCode: 200,
            message: 'Fee type updated successfully',
            data: feeType,
        };
    }
    async remove(id) {
        const feeType = await this.feeTypesService.softDelete(id);
        return {
            statusCode: 200,
            message: 'Fee type deleted successfully',
            data: feeType,
        };
    }
    async restore(id) {
        const feeType = await this.feeTypesService.restore(id);
        return {
            statusCode: 200,
            message: 'Fee type restored successfully',
            data: feeType,
        };
    }
};
exports.FeeTypesController = FeeTypesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new fee type',
        description: 'Create a new fee type',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_fee_type_dto_1.CreateFeeTypeDto]),
    __metadata("design:returntype", Promise)
], FeeTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all fee types',
        description: 'Get paginated list of fee types',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], FeeTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active fee types',
        description: 'Get all active fee types',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeeTypesController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get fee types by category',
        description: 'Get fee types by category',
    }),
    (0, swagger_1.ApiParam)({ name: 'category', description: 'Fee category' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeeTypesController.prototype, "getByCategory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get fee type by ID',
        description: 'Get fee type information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Fee Type ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeeTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update fee type',
        description: 'Update fee type information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Fee Type ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_fee_type_dto_1.UpdateFeeTypeDto]),
    __metadata("design:returntype", Promise)
], FeeTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete fee type',
        description: 'Soft delete fee type',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Fee Type ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeeTypesController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Restore deleted fee type',
        description: 'Restore a soft deleted fee type',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Fee Type ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeeTypesController.prototype, "restore", null);
exports.FeeTypesController = FeeTypesController = __decorate([
    (0, swagger_1.ApiTags)('Fee Types'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('fee-types'),
    __metadata("design:paramtypes", [fee_types_service_1.FeeTypesService])
], FeeTypesController);
//# sourceMappingURL=fee-types.controller.js.map