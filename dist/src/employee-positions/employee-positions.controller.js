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
exports.EmployeePositionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employee_positions_service_1 = require("./employee-positions.service");
const create_employee_position_dto_1 = require("./dto/create-employee-position.dto");
const update_employee_position_dto_1 = require("./dto/update-employee-position.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let EmployeePositionsController = class EmployeePositionsController {
    constructor(employeePositionsService) {
        this.employeePositionsService = employeePositionsService;
    }
    async create(createEmployeePositionDto) {
        const position = await this.employeePositionsService.create(createEmployeePositionDto);
        return {
            statusCode: 201,
            message: 'Employee position created successfully',
            data: position,
        };
    }
    async findAll(queryOptions) {
        const result = await this.employeePositionsService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Employee positions retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getActive() {
        const positions = await this.employeePositionsService.getActivePositions();
        return {
            statusCode: 200,
            message: 'Active positions retrieved successfully',
            data: positions,
        };
    }
    async getByDepartment(department) {
        const positions = await this.employeePositionsService.getByDepartment(department);
        return {
            statusCode: 200,
            message: 'Positions retrieved successfully',
            data: positions,
        };
    }
    async findOne(id) {
        const position = await this.employeePositionsService.findById(id);
        return {
            statusCode: 200,
            message: 'Employee position retrieved successfully',
            data: position,
        };
    }
    async update(id, updateEmployeePositionDto) {
        const position = await this.employeePositionsService.update(id, updateEmployeePositionDto);
        return {
            statusCode: 200,
            message: 'Employee position updated successfully',
            data: position,
        };
    }
    async remove(id) {
        const position = await this.employeePositionsService.softDelete(id);
        return {
            statusCode: 200,
            message: 'Employee position deleted successfully',
            data: position,
        };
    }
    async restore(id) {
        const position = await this.employeePositionsService.restore(id);
        return {
            statusCode: 200,
            message: 'Employee position restored successfully',
            data: position,
        };
    }
};
exports.EmployeePositionsController = EmployeePositionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new employee position',
        description: 'Create a new employee position',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_position_dto_1.CreateEmployeePositionDto]),
    __metadata("design:returntype", Promise)
], EmployeePositionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all employee positions',
        description: 'Get paginated list of employee positions',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], EmployeePositionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active employee positions',
        description: 'Get all active employee positions',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeePositionsController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)('department/:department'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get positions by department',
        description: 'Get employee positions by department',
    }),
    (0, swagger_1.ApiParam)({ name: 'department', description: 'Department name' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('department')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeePositionsController.prototype, "getByDepartment", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get employee position by ID',
        description: 'Get employee position information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee Position ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeePositionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update employee position',
        description: 'Update employee position information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee Position ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_position_dto_1.UpdateEmployeePositionDto]),
    __metadata("design:returntype", Promise)
], EmployeePositionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete employee position',
        description: 'Soft delete employee position',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee Position ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeePositionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Restore deleted employee position',
        description: 'Restore a soft deleted employee position',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee Position ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeePositionsController.prototype, "restore", null);
exports.EmployeePositionsController = EmployeePositionsController = __decorate([
    (0, swagger_1.ApiTags)('Employee Positions'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('employee-positions'),
    __metadata("design:paramtypes", [employee_positions_service_1.EmployeePositionsService])
], EmployeePositionsController);
//# sourceMappingURL=employee-positions.controller.js.map