"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeSalaryHeadersModule = void 0;
const common_1 = require("@nestjs/common");
const employee_salary_headers_controller_1 = require("./employee-salary-headers.controller");
const employee_salary_headers_service_1 = require("./employee-salary-headers.service");
const employee_salary_headers_repository_1 = require("./employee-salary-headers.repository");
const cash_transactions_module_1 = require("../cash-transactions/cash-transactions.module");
let EmployeeSalaryHeadersModule = class EmployeeSalaryHeadersModule {
};
exports.EmployeeSalaryHeadersModule = EmployeeSalaryHeadersModule;
exports.EmployeeSalaryHeadersModule = EmployeeSalaryHeadersModule = __decorate([
    (0, common_1.Module)({
        imports: [cash_transactions_module_1.CashTransactionsModule],
        controllers: [employee_salary_headers_controller_1.EmployeeSalaryHeadersController],
        providers: [employee_salary_headers_service_1.EmployeeSalaryHeadersService, employee_salary_headers_repository_1.EmployeeSalaryHeadersRepository],
        exports: [employee_salary_headers_service_1.EmployeeSalaryHeadersService, employee_salary_headers_repository_1.EmployeeSalaryHeadersRepository],
    })
], EmployeeSalaryHeadersModule);
//# sourceMappingURL=employee-salary-headers.module.js.map