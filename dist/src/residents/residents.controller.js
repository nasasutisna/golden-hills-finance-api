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
exports.ResidentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const residents_service_1 = require("./residents.service");
const create_resident_dto_1 = require("./dto/create-resident.dto");
const update_resident_dto_1 = require("./dto/update-resident.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let ResidentsController = class ResidentsController {
    constructor(residentsService) {
        this.residentsService = residentsService;
    }
    async create(createResidentDto) {
        const resident = await this.residentsService.create(createResidentDto);
        return {
            statusCode: 201,
            message: 'Resident created successfully',
            data: resident,
        };
    }
    async findAll(queryOptions) {
        const result = await this.residentsService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Residents retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getActiveCount() {
        const count = await this.residentsService.getActiveResidentsCount();
        return {
            statusCode: 200,
            message: 'Active residents count retrieved successfully',
            data: { count },
        };
    }
    async getByHouseBlock(houseBlockId) {
        const residents = await this.residentsService.getByHouseBlock(houseBlockId);
        return {
            statusCode: 200,
            message: 'Residents retrieved successfully',
            data: residents,
        };
    }
    async findOne(id) {
        const resident = await this.residentsService.findById(id);
        return {
            statusCode: 200,
            message: 'Resident retrieved successfully',
            data: resident,
        };
    }
    async update(id, updateResidentDto) {
        const resident = await this.residentsService.update(id, updateResidentDto);
        return {
            statusCode: 200,
            message: 'Resident updated successfully',
            data: resident,
        };
    }
    async remove(id) {
        const resident = await this.residentsService.softDelete(id);
        return {
            statusCode: 200,
            message: 'Resident deleted successfully',
            data: resident,
        };
    }
    async restore(id) {
        const resident = await this.residentsService.restore(id);
        return {
            statusCode: 200,
            message: 'Resident restored successfully',
            data: resident,
        };
    }
};
exports.ResidentsController = ResidentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new resident',
        description: 'Create a new resident profile',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resident_dto_1.CreateResidentDto]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all residents',
        description: 'Get paginated list of residents',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active/count'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active residents count',
        description: 'Get total number of active residents',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "getActiveCount", null);
__decorate([
    (0, common_1.Get)('house-block/:houseBlockId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get residents by house block',
        description: 'Get all residents in a specific house block',
    }),
    (0, swagger_1.ApiParam)({ name: 'houseBlockId', description: 'House Block ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('houseBlockId', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "getByHouseBlock", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get resident by ID',
        description: 'Get resident information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resident ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update resident',
        description: 'Update resident information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resident ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resident_dto_1.UpdateResidentDto]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete resident',
        description: 'Soft delete resident profile',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resident ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Restore deleted resident',
        description: 'Restore a soft deleted resident',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resident ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "restore", null);
exports.ResidentsController = ResidentsController = __decorate([
    (0, swagger_1.ApiTags)('Residents'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('residents'),
    __metadata("design:paramtypes", [residents_service_1.ResidentsService])
], ResidentsController);
//# sourceMappingURL=residents.controller.js.map