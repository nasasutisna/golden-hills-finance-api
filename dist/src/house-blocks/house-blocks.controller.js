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
exports.HouseBlocksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const house_blocks_service_1 = require("./house-blocks.service");
const create_house_block_dto_1 = require("./dto/create-house-block.dto");
const update_house_block_dto_1 = require("./dto/update-house-block.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let HouseBlocksController = class HouseBlocksController {
    constructor(houseBlocksService) {
        this.houseBlocksService = houseBlocksService;
    }
    async create(createHouseBlockDto) {
        const houseBlock = await this.houseBlocksService.create(createHouseBlockDto);
        return {
            statusCode: 201,
            message: 'House block created successfully',
            data: houseBlock,
        };
    }
    async findAll(queryOptions) {
        const result = await this.houseBlocksService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'House blocks retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getOccupancyStats() {
        const stats = await this.houseBlocksService.getOccupancyStats();
        return {
            statusCode: 200,
            message: 'Occupancy statistics retrieved successfully',
            data: stats,
        };
    }
    async findOne(id) {
        const houseBlock = await this.houseBlocksService.findById(id);
        return {
            statusCode: 200,
            message: 'House block retrieved successfully',
            data: houseBlock,
        };
    }
    async update(id, updateHouseBlockDto) {
        const houseBlock = await this.houseBlocksService.update(id, updateHouseBlockDto);
        return {
            statusCode: 200,
            message: 'House block updated successfully',
            data: houseBlock,
        };
    }
    async remove(id) {
        const houseBlock = await this.houseBlocksService.softDelete(id);
        return {
            statusCode: 200,
            message: 'House block deleted successfully',
            data: houseBlock,
        };
    }
    async restore(id) {
        const houseBlock = await this.houseBlocksService.restore(id);
        return {
            statusCode: 200,
            message: 'House block restored successfully',
            data: houseBlock,
        };
    }
};
exports.HouseBlocksController = HouseBlocksController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new house block',
        description: 'Create a new house block/building',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_house_block_dto_1.CreateHouseBlockDto]),
    __metadata("design:returntype", Promise)
], HouseBlocksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all house blocks',
        description: 'Get paginated list of house blocks',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], HouseBlocksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('occupancy/stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get occupancy statistics',
        description: 'Get occupancy statistics for all house blocks',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HouseBlocksController.prototype, "getOccupancyStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get house block by ID',
        description: 'Get house block information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'House Block ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseBlocksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update house block',
        description: 'Update house block information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'House Block ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_house_block_dto_1.UpdateHouseBlockDto]),
    __metadata("design:returntype", Promise)
], HouseBlocksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete house block',
        description: 'Soft delete house block',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'House Block ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseBlocksController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Restore deleted house block',
        description: 'Restore a soft deleted house block',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'House Block ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseBlocksController.prototype, "restore", null);
exports.HouseBlocksController = HouseBlocksController = __decorate([
    (0, swagger_1.ApiTags)('House Blocks'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('house-blocks'),
    __metadata("design:paramtypes", [house_blocks_service_1.HouseBlocksService])
], HouseBlocksController);
//# sourceMappingURL=house-blocks.controller.js.map