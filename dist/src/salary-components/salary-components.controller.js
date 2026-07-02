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
exports.SalaryComponentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const salary_components_service_1 = require("./salary-components.service");
const create_salary_component_dto_1 = require("./dto/create-salary-component.dto");
const update_salary_component_dto_1 = require("./dto/update-salary-component.dto");
const query_salary_components_dto_1 = require("./dto/query-salary-components.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let SalaryComponentsController = class SalaryComponentsController {
    constructor(salaryComponentsService) {
        this.salaryComponentsService = salaryComponentsService;
    }
    create(createSalaryComponentDto) {
        return this.salaryComponentsService.create(createSalaryComponentDto);
    }
    findAll(queryDto) {
        return this.salaryComponentsService.findAll(queryDto);
    }
    getActiveComponents() {
        return this.salaryComponentsService.getActiveComponents();
    }
    findById(id) {
        return this.salaryComponentsService.findById(id);
    }
    update(id, updateSalaryComponentDto) {
        return this.salaryComponentsService.update(id, updateSalaryComponentDto);
    }
    remove(id) {
        return this.salaryComponentsService.remove(id);
    }
};
exports.SalaryComponentsController = SalaryComponentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new salary component' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Salary component created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Component code already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_salary_component_dto_1.CreateSalaryComponentDto]),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all salary components with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Salary components retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_salary_components_dto_1.QuerySalaryComponentsDto]),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active salary components' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active salary components retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "getActiveComponents", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get salary component by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Salary component retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Salary component not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ACCOUNTANT', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Update salary component' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Salary component updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Salary component not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_salary_component_dto_1.UpdateSalaryComponentDto]),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete salary component' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Salary component deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Salary component not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "remove", null);
exports.SalaryComponentsController = SalaryComponentsController = __decorate([
    (0, swagger_1.ApiTags)('Salary Components'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('salary-components'),
    __metadata("design:paramtypes", [salary_components_service_1.SalaryComponentsService])
], SalaryComponentsController);
//# sourceMappingURL=salary-components.controller.js.map