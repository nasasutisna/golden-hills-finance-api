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
exports.TransactionCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transaction_categories_service_1 = require("./transaction-categories.service");
const create_transaction_category_dto_1 = require("./dto/create-transaction-category.dto");
const update_transaction_category_dto_1 = require("./dto/update-transaction-category.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let TransactionCategoriesController = class TransactionCategoriesController {
    constructor(transactionCategoriesService) {
        this.transactionCategoriesService = transactionCategoriesService;
    }
    async create(createTransactionCategoryDto) {
        const category = await this.transactionCategoriesService.create(createTransactionCategoryDto);
        return {
            statusCode: 201,
            message: 'Transaction category created successfully',
            data: category,
        };
    }
    async findAll(queryOptions) {
        const result = await this.transactionCategoriesService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Transaction categories retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getActive() {
        const categories = await this.transactionCategoriesService.getActiveCategories();
        return {
            statusCode: 200,
            message: 'Active transaction categories retrieved successfully',
            data: categories,
        };
    }
    async getByType(categoryType) {
        const categories = await this.transactionCategoriesService.getByType(categoryType);
        return {
            statusCode: 200,
            message: 'Transaction categories retrieved successfully',
            data: categories,
        };
    }
    async getParentCategories() {
        const categories = await this.transactionCategoriesService.getParentCategories();
        return {
            statusCode: 200,
            message: 'Parent categories retrieved successfully',
            data: categories,
        };
    }
    async findOne(id) {
        const category = await this.transactionCategoriesService.findById(id);
        return {
            statusCode: 200,
            message: 'Transaction category retrieved successfully',
            data: category,
        };
    }
    async update(id, updateTransactionCategoryDto) {
        const category = await this.transactionCategoriesService.update(id, updateTransactionCategoryDto);
        return {
            statusCode: 200,
            message: 'Transaction category updated successfully',
            data: category,
        };
    }
    async remove(id) {
        const category = await this.transactionCategoriesService.softDelete(id);
        return {
            statusCode: 200,
            message: 'Transaction category deleted successfully',
            data: category,
        };
    }
    async restore(id) {
        const category = await this.transactionCategoriesService.restore(id);
        return {
            statusCode: 200,
            message: 'Transaction category restored successfully',
            data: category,
        };
    }
};
exports.TransactionCategoriesController = TransactionCategoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new transaction category',
        description: 'Create a new transaction category',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transaction_category_dto_1.CreateTransactionCategoryDto]),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all transaction categories',
        description: 'Get paginated list of transaction categories',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active transaction categories',
        description: 'Get all active transaction categories',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)('type/:categoryType'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get categories by type',
        description: 'Get transaction categories by type (INCOME/EXPENSE)',
    }),
    (0, swagger_1.ApiParam)({ name: 'categoryType', description: 'Category type' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('categoryType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "getByType", null);
__decorate([
    (0, common_1.Get)('parent'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get parent categories',
        description: 'Get all parent transaction categories',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "getParentCategories", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transaction category by ID',
        description: 'Get transaction category information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Transaction Category ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update transaction category',
        description: 'Update transaction category information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Transaction Category ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_transaction_category_dto_1.UpdateTransactionCategoryDto]),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete transaction category',
        description: 'Soft delete transaction category',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Transaction Category ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Restore deleted transaction category',
        description: 'Restore a soft deleted transaction category',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Transaction Category ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionCategoriesController.prototype, "restore", null);
exports.TransactionCategoriesController = TransactionCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('Transaction Categories'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('transaction-categories'),
    __metadata("design:paramtypes", [transaction_categories_service_1.TransactionCategoriesService])
], TransactionCategoriesController);
//# sourceMappingURL=transaction-categories.controller.js.map