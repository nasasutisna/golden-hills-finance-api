"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesModule = void 0;
const common_1 = require("@nestjs/common");
const employees_controller_1 = require("./employees.controller");
const employees_service_1 = require("./employees.service");
const employees_repository_1 = require("./employees.repository");
const prisma_module_1 = require("../prisma/prisma.module");
const employee_positions_module_1 = require("../employee-positions/employee-positions.module");
const roles_module_1 = require("../roles/roles.module");
const users_module_1 = require("../users/users.module");
let EmployeesModule = class EmployeesModule {
};
exports.EmployeesModule = EmployeesModule;
exports.EmployeesModule = EmployeesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            employee_positions_module_1.EmployeePositionsModule,
            roles_module_1.RolesModule,
            users_module_1.UsersModule,
        ],
        controllers: [employees_controller_1.EmployeesController],
        providers: [employees_service_1.EmployeesService, employees_repository_1.EmployeesRepository],
        exports: [employees_service_1.EmployeesService, employees_repository_1.EmployeesRepository],
    })
], EmployeesModule);
//# sourceMappingURL=employees.module.js.map