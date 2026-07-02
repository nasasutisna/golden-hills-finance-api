"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeSalaryDetailsModule = void 0;
const common_1 = require("@nestjs/common");
const employee_salary_details_controller_1 = require("./employee-salary-details.controller");
const employee_salary_details_service_1 = require("./employee-salary-details.service");
const employee_salary_details_repository_1 = require("./employee-salary-details.repository");
let EmployeeSalaryDetailsModule = class EmployeeSalaryDetailsModule {
};
exports.EmployeeSalaryDetailsModule = EmployeeSalaryDetailsModule;
exports.EmployeeSalaryDetailsModule = EmployeeSalaryDetailsModule = __decorate([
    (0, common_1.Module)({
        controllers: [employee_salary_details_controller_1.EmployeeSalaryDetailsController],
        providers: [employee_salary_details_service_1.EmployeeSalaryDetailsService, employee_salary_details_repository_1.EmployeeSalaryDetailsRepository],
        exports: [employee_salary_details_service_1.EmployeeSalaryDetailsService, employee_salary_details_repository_1.EmployeeSalaryDetailsRepository],
    })
], EmployeeSalaryDetailsModule);
//# sourceMappingURL=employee-salary-details.module.js.map