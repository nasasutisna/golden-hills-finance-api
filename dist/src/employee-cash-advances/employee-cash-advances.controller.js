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
exports.EmployeeCashAdvancesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employee_cash_advances_service_1 = require("./employee-cash-advances.service");
const create_employee_cash_advance_dto_1 = require("./dto/create-employee-cash-advance.dto");
const update_employee_cash_advance_dto_1 = require("./dto/update-employee-cash-advance.dto");
const query_employee_cash_advances_dto_1 = require("./dto/query-employee-cash-advances.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let EmployeeCashAdvancesController = class EmployeeCashAdvancesController {
    constructor(employeeCashAdvancesService) {
        this.employeeCashAdvancesService = employeeCashAdvancesService;
    }
    create(createEmployeeCashAdvanceDto, userId) {
        return this.employeeCashAdvancesService.create(createEmployeeCashAdvanceDto, userId);
    }
    findAll(queryDto) {
        return this.employeeCashAdvancesService.findAll(queryDto);
    }
    findPendingApproval() {
        return this.employeeCashAdvancesService.findPendingApproval();
    }
    findByEmployee(employeeId) {
        return this.employeeCashAdvancesService.findByEmployee(employeeId);
    }
    findById(id) {
        return this.employeeCashAdvancesService.findById(id);
    }
    update(id, updateEmployeeCashAdvanceDto) {
        return this.employeeCashAdvancesService.update(id, updateEmployeeCashAdvanceDto);
    }
    approveAdvance(id, approverId, notes) {
        return this.employeeCashAdvancesService.approveAdvance(id, approverId, notes);
    }
    rejectAdvance(id, approverId, notes) {
        return this.employeeCashAdvancesService.rejectAdvance(id, approverId, notes);
    }
    disburseAdvance(id, disbursementDate) {
        return this.employeeCashAdvancesService.disburseAdvance(id, disbursementDate ? new Date(disbursementDate) : undefined);
    }
    recordRepayment(id, amount, paymentDate, notes) {
        return this.employeeCashAdvancesService.recordRepayment(id, amount, paymentDate ? new Date(paymentDate) : undefined, notes);
    }
    remove(id) {
        return this.employeeCashAdvancesService.remove(id);
    }
};
exports.EmployeeCashAdvancesController = EmployeeCashAdvancesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new employee cash advance request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Employee cash advance created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Advance number already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_cash_advance_dto_1.CreateEmployeeCashAdvanceDto, String]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employee cash advances with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee cash advances retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_employee_cash_advances_dto_1.QueryEmployeeCashAdvancesDto]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pending advances awaiting approval' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pending advances retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "findPendingApproval", null);
__decorate([
    (0, common_1.Get)('employee/:employeeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all cash advances for an employee' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cash advances retrieved successfully' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "findByEmployee", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee cash advance by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee cash advance retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee cash advance not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee cash advance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee cash advance updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee cash advance not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_cash_advance_dto_1.UpdateEmployeeCashAdvanceDto]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve employee cash advance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee cash advance approved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee cash advance not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot approve advance with current status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "approveAdvance", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject employee cash advance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee cash advance rejected successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee cash advance not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot reject advance with current status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "rejectAdvance", null);
__decorate([
    (0, common_1.Patch)(':id/disburse'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({ summary: 'Disburse approved cash advance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cash advance disbursed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee cash advance not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot disburse advance with current status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('disbursementDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "disburseAdvance", null);
__decorate([
    (0, common_1.Patch)(':id/repay'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT'),
    (0, swagger_1.ApiOperation)({ summary: 'Record repayment for cash advance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Repayment recorded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee cash advance not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot record repayment for advance with current status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, common_1.Body)('paymentDate')),
    __param(3, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "recordRepayment", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete employee cash advance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee cash advance deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee cash advance not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeCashAdvancesController.prototype, "remove", null);
exports.EmployeeCashAdvancesController = EmployeeCashAdvancesController = __decorate([
    (0, swagger_1.ApiTags)('Employee Cash Advances'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('employee-cash-advances'),
    __metadata("design:paramtypes", [employee_cash_advances_service_1.EmployeeCashAdvancesService])
], EmployeeCashAdvancesController);
//# sourceMappingURL=employee-cash-advances.controller.js.map