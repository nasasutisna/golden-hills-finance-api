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
exports.EmployeeSalaryDetailsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employee_salary_details_service_1 = require("./employee-salary-details.service");
const create_employee_salary_detail_dto_1 = require("./dto/create-employee-salary-detail.dto");
const update_employee_salary_detail_dto_1 = require("./dto/update-employee-salary-detail.dto");
const query_employee_salary_details_dto_1 = require("./dto/query-employee-salary-details.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let EmployeeSalaryDetailsController = class EmployeeSalaryDetailsController {
    constructor(employeeSalaryDetailsService) {
        this.employeeSalaryDetailsService = employeeSalaryDetailsService;
    }
    create(createEmployeeSalaryDetailDto) {
        return this.employeeSalaryDetailsService.create(createEmployeeSalaryDetailDto);
    }
    findAll(queryDto) {
        return this.employeeSalaryDetailsService.findAll(queryDto);
    }
    findBySalaryHeader(salaryHeaderId) {
        return this.employeeSalaryDetailsService.findBySalaryHeader(salaryHeaderId);
    }
    findById(id) {
        return this.employeeSalaryDetailsService.findById(id);
    }
    update(id, updateEmployeeSalaryDetailDto) {
        return this.employeeSalaryDetailsService.update(id, updateEmployeeSalaryDetailDto);
    }
    remove(id) {
        return this.employeeSalaryDetailsService.remove(id);
    }
};
exports.EmployeeSalaryDetailsController = EmployeeSalaryDetailsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new employee salary detail' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Employee salary detail created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Component already exists for this header or payroll is locked' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_salary_detail_dto_1.CreateEmployeeSalaryDetailDto]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryDetailsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employee salary details with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary details retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_employee_salary_details_dto_1.QueryEmployeeSalaryDetailsDto]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryDetailsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('header/:salaryHeaderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all salary details for a specific header' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Salary details retrieved successfully' }),
    __param(0, (0, common_1.Param)('salaryHeaderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryDetailsController.prototype, "findBySalaryHeader", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee salary detail by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary detail retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary detail not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryDetailsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee salary detail' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary detail updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary detail not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot modify details of locked payroll' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_salary_detail_dto_1.UpdateEmployeeSalaryDetailDto]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryDetailsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete employee salary detail' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary detail deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary detail not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot delete details from locked payroll' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryDetailsController.prototype, "remove", null);
exports.EmployeeSalaryDetailsController = EmployeeSalaryDetailsController = __decorate([
    (0, swagger_1.ApiTags)('Employee Salary Details'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('employee-salary-details'),
    __metadata("design:paramtypes", [employee_salary_details_service_1.EmployeeSalaryDetailsService])
], EmployeeSalaryDetailsController);
//# sourceMappingURL=employee-salary-details.controller.js.map