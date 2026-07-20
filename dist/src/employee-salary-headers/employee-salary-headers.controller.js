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
exports.EmployeeSalaryHeadersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employee_salary_headers_service_1 = require("./employee-salary-headers.service");
const create_employee_salary_header_dto_1 = require("./dto/create-employee-salary-header.dto");
const create_simple_payroll_dto_1 = require("./dto/create-simple-payroll.dto");
const update_employee_salary_header_dto_1 = require("./dto/update-employee-salary-header.dto");
const query_employee_salary_headers_dto_1 = require("./dto/query-employee-salary-headers.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let EmployeeSalaryHeadersController = class EmployeeSalaryHeadersController {
    constructor(employeeSalaryHeadersService) {
        this.employeeSalaryHeadersService = employeeSalaryHeadersService;
    }
    create(createEmployeeSalaryHeaderDto) {
        return this.employeeSalaryHeadersService.create(createEmployeeSalaryHeaderDto);
    }
    createSimplePayroll(dto, userId) {
        return this.employeeSalaryHeadersService.createSimplePayroll(dto, userId);
    }
    findAll(queryDto) {
        return this.employeeSalaryHeadersService.findAll(queryDto);
    }
    findById(id) {
        return this.employeeSalaryHeadersService.findById(id);
    }
    update(id, updateEmployeeSalaryHeaderDto) {
        return this.employeeSalaryHeadersService.update(id, updateEmployeeSalaryHeaderDto);
    }
    calculateSalary(id) {
        return this.employeeSalaryHeadersService.calculateSalary(id);
    }
    approveSalary(id, approverId) {
        return this.employeeSalaryHeadersService.approveSalary(id, approverId);
    }
    markAsPaid(id, userId, paymentDate) {
        return this.employeeSalaryHeadersService.markAsPaid(id, paymentDate ? new Date(paymentDate) : undefined, userId);
    }
    cancelPayroll(id, userId, reason) {
        return this.employeeSalaryHeadersService.cancelPayroll(id, userId, reason);
    }
    remove(id) {
        return this.employeeSalaryHeadersService.remove(id);
    }
};
exports.EmployeeSalaryHeadersController = EmployeeSalaryHeadersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new employee salary header' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Employee salary header created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Payroll number already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_salary_header_dto_1.CreateEmployeeSalaryHeaderDto]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('simple'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Penggajian sederhana: catat gaji (1 angka) & langsung posting pengeluaran Kas IPL',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payroll created and IPL expense posted' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Salary for this employee/period already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_simple_payroll_dto_1.CreateSimplePayrollDto, String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "createSimplePayroll", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employee salary headers with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary headers retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_employee_salary_headers_dto_1.QueryEmployeeSalaryHeadersDto]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee salary header by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary header retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary header not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee salary header' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary header updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary header not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot modify locked payroll' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_salary_header_dto_1.UpdateEmployeeSalaryHeaderDto]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/calculate'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate employee salary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary calculated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary header not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot calculate locked payroll or invalid status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "calculateSalary", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve employee salary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary approved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary header not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot approve locked payroll or invalid status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "approveSalary", null);
__decorate([
    (0, common_1.Patch)(':id/pay'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark employee salary as paid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary marked as paid successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary header not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot mark as paid with invalid status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('paymentDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "markAsPaid", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Batalkan penggajian (CANCELLED) & hapus transaksi Kas IPL tertaut',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payroll cancelled, IPL expense removed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary header not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Only PAID payroll can be cancelled' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "cancelPayroll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete employee salary header' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee salary header deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee salary header not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot delete locked payroll' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeSalaryHeadersController.prototype, "remove", null);
exports.EmployeeSalaryHeadersController = EmployeeSalaryHeadersController = __decorate([
    (0, swagger_1.ApiTags)('Employee Salary Headers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('employee-salary-headers'),
    __metadata("design:paramtypes", [employee_salary_headers_service_1.EmployeeSalaryHeadersService])
], EmployeeSalaryHeadersController);
//# sourceMappingURL=employee-salary-headers.controller.js.map