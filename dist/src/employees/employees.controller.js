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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const update_employee_dto_1 = require("./dto/update-employee.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let EmployeesController = class EmployeesController {
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    async create(createEmployeeDto) {
        const employee = await this.employeesService.create(createEmployeeDto);
        return {
            statusCode: 201,
            message: 'Employee created successfully',
            data: employee,
        };
    }
    async findAll(queryOptions) {
        const result = await this.employeesService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Employees retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async getStatistics() {
        const stats = await this.employeesService.getEmployeeStatistics();
        return {
            statusCode: 200,
            message: 'Employee statistics retrieved successfully',
            data: stats,
        };
    }
    async getByPosition(positionId) {
        const employees = await this.employeesService.getByPosition(positionId);
        return {
            statusCode: 200,
            message: 'Employees retrieved successfully',
            data: employees,
        };
    }
    async getByDepartment(department) {
        const employees = await this.employeesService.getByDepartment(department);
        return {
            statusCode: 200,
            message: 'Employees retrieved successfully',
            data: employees,
        };
    }
    async getByEmploymentStatus(status) {
        const employees = await this.employeesService.getByEmploymentStatus(status);
        return {
            statusCode: 200,
            message: 'Employees retrieved successfully',
            data: employees,
        };
    }
    async findOne(id) {
        const employee = await this.employeesService.findById(id);
        return {
            statusCode: 200,
            message: 'Employee retrieved successfully',
            data: employee,
        };
    }
    async update(id, updateEmployeeDto) {
        const employee = await this.employeesService.update(id, updateEmployeeDto);
        return {
            statusCode: 200,
            message: 'Employee updated successfully',
            data: employee,
        };
    }
    async remove(id) {
        const employee = await this.employeesService.softDelete(id);
        return {
            statusCode: 200,
            message: 'Employee deleted successfully',
            data: employee,
        };
    }
    async restore(id) {
        const employee = await this.employeesService.restore(id);
        return {
            statusCode: 200,
            message: 'Employee restored successfully',
            data: employee,
        };
    }
    async deactivate(id) {
        const employee = await this.employeesService.deactivate(id);
        return {
            statusCode: 200,
            message: 'Employee deactivated successfully',
            data: employee,
        };
    }
    async activate(id) {
        const employee = await this.employeesService.activate(id);
        return {
            statusCode: 200,
            message: 'Employee activated successfully',
            data: employee,
        };
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new employee',
        description: 'Create a new employee',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all employees',
        description: 'Get paginated list of employees',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get employee statistics',
        description: 'Get employee statistics and totals',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('position/:positionId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get employees by position',
        description: 'Get all employees in a specific position',
    }),
    (0, swagger_1.ApiParam)({ name: 'positionId', description: 'Position ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('positionId', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getByPosition", null);
__decorate([
    (0, common_1.Get)('department/:department'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get employees by department',
        description: 'Get all employees in a specific department',
    }),
    (0, swagger_1.ApiParam)({ name: 'department', description: 'Department name' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('department')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getByDepartment", null);
__decorate([
    (0, common_1.Get)('status/:status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get employees by employment status',
        description: 'Get employees by employment status',
    }),
    (0, swagger_1.ApiParam)({ name: 'status', description: 'Employment status' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getByEmploymentStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get employee by ID',
        description: 'Get employee information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update employee',
        description: 'Update employee information',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete employee',
        description: 'Soft delete employee',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Restore deleted employee',
        description: 'Restore a soft deleted employee',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "restore", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Deactivate employee',
        description: 'Deactivate an employee',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Activate employee',
        description: 'Activate an employee',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "activate", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map