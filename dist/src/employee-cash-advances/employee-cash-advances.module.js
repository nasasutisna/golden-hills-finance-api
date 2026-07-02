"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeCashAdvancesModule = void 0;
const common_1 = require("@nestjs/common");
const employee_cash_advances_controller_1 = require("./employee-cash-advances.controller");
const employee_cash_advances_service_1 = require("./employee-cash-advances.service");
const employee_cash_advances_repository_1 = require("./employee-cash-advances.repository");
let EmployeeCashAdvancesModule = class EmployeeCashAdvancesModule {
};
exports.EmployeeCashAdvancesModule = EmployeeCashAdvancesModule;
exports.EmployeeCashAdvancesModule = EmployeeCashAdvancesModule = __decorate([
    (0, common_1.Module)({
        controllers: [employee_cash_advances_controller_1.EmployeeCashAdvancesController],
        providers: [employee_cash_advances_service_1.EmployeeCashAdvancesService, employee_cash_advances_repository_1.EmployeeCashAdvancesRepository],
        exports: [employee_cash_advances_service_1.EmployeeCashAdvancesService, employee_cash_advances_repository_1.EmployeeCashAdvancesRepository],
    })
], EmployeeCashAdvancesModule);
//# sourceMappingURL=employee-cash-advances.module.js.map