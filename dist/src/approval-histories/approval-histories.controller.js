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
exports.ApprovalHistoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const approval_histories_service_1 = require("./approval-histories.service");
const create_approval_history_dto_1 = require("./dto/create-approval-history.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let ApprovalHistoriesController = class ApprovalHistoriesController {
    constructor(approvalHistoriesService) {
        this.approvalHistoriesService = approvalHistoriesService;
    }
    async create(createApprovalHistoryDto) {
        const history = await this.approvalHistoriesService.create(createApprovalHistoryDto);
        return {
            statusCode: 201,
            message: 'Approval history created successfully',
            data: history,
        };
    }
    async findAll(queryOptions) {
        const result = await this.approvalHistoriesService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Approval histories retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getByEntity(entityType, entityId) {
        const histories = await this.approvalHistoriesService.findByEntity(entityType, entityId);
        return {
            statusCode: 200,
            message: 'Approval histories retrieved successfully',
            data: histories,
        };
    }
};
exports.ApprovalHistoriesController = ApprovalHistoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create approval history',
        description: 'Create an approval history record',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_approval_history_dto_1.CreateApprovalHistoryDto]),
    __metadata("design:returntype", Promise)
], ApprovalHistoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all approval histories',
        description: 'Get paginated list of approval histories',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], ApprovalHistoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':entityType/:entityId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get approval history by entity',
        description: 'Get approval history for a specific entity',
    }),
    (0, swagger_1.ApiParam)({ name: 'entityType', description: 'Entity type (e.g., CashTransaction)' }),
    (0, swagger_1.ApiParam)({ name: 'entityId', description: 'Entity ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('entityId', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ApprovalHistoriesController.prototype, "getByEntity", null);
exports.ApprovalHistoriesController = ApprovalHistoriesController = __decorate([
    (0, swagger_1.ApiTags)('Approval Histories'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('approval-histories'),
    __metadata("design:paramtypes", [approval_histories_service_1.ApprovalHistoriesService])
], ApprovalHistoriesController);
//# sourceMappingURL=approval-histories.controller.js.map