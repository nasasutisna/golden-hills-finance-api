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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeSalaryDetailsService = void 0;
const common_1 = require("@nestjs/common");
const employee_salary_details_repository_1 = require("./employee-salary-details.repository");
const prisma_service_1 = require("../prisma/prisma.service");
let EmployeeSalaryDetailsService = class EmployeeSalaryDetailsService {
    constructor(repository, prisma) {
        this.repository = repository;
        this.prisma = prisma;
    }
    async create(createEmployeeSalaryDetailDto) {
        const header = await this.prisma.employeeSalaryHeader.findFirst({
            where: { id: createEmployeeSalaryDetailDto.salaryHeaderId, deletedAt: null },
        });
        if (!header) {
            throw new common_1.NotFoundException(`Salary header with ID ${createEmployeeSalaryDetailDto.salaryHeaderId} not found`);
        }
        if (header.locked) {
            throw new common_1.ConflictException('Cannot add details to locked payroll');
        }
        const component = await this.prisma.salaryComponent.findFirst({
            where: { id: createEmployeeSalaryDetailDto.componentId, deletedAt: null },
        });
        if (!component) {
            throw new common_1.NotFoundException(`Salary component with ID ${createEmployeeSalaryDetailDto.componentId} not found`);
        }
        const existing = await this.prisma.employeeSalaryDetail.findFirst({
            where: {
                salaryHeaderId: createEmployeeSalaryDetailDto.salaryHeaderId,
                componentId: createEmployeeSalaryDetailDto.componentId,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('This salary component already exists for this salary header');
        }
        return this.repository.create(createEmployeeSalaryDetailDto);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, salaryHeaderId, salaryComponentId, manualOverride } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (salaryHeaderId) {
            where.salaryHeaderId = salaryHeaderId;
        }
        if (salaryComponentId) {
            where.salaryComponentId = salaryComponentId;
        }
        if (manualOverride !== undefined) {
            where.manualOverride = manualOverride;
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'asc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const detail = await this.repository.findById(id);
        if (!detail) {
            throw new common_1.NotFoundException(`Employee salary detail with ID ${id} not found`);
        }
        return detail;
    }
    async findBySalaryHeader(salaryHeaderId) {
        return this.repository.findBySalaryHeader(salaryHeaderId);
    }
    async update(id, updateEmployeeSalaryDetailDto) {
        const detail = await this.findById(id);
        const header = await this.prisma.employeeSalaryHeader.findFirst({
            where: { id: detail.salaryHeaderId, deletedAt: null },
        });
        if (header && header.locked) {
            throw new common_1.ConflictException('Cannot modify details of locked payroll');
        }
        return this.repository.update(id, updateEmployeeSalaryDetailDto);
    }
    async remove(id) {
        const detail = await this.findById(id);
        const header = await this.prisma.employeeSalaryHeader.findFirst({
            where: { id: detail.salaryHeaderId, deletedAt: null },
        });
        if (header && header.locked) {
            throw new common_1.ConflictException('Cannot delete details from locked payroll');
        }
        return this.repository.softDelete(id);
    }
};
exports.EmployeeSalaryDetailsService = EmployeeSalaryDetailsService;
exports.EmployeeSalaryDetailsService = EmployeeSalaryDetailsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_salary_details_repository_1.EmployeeSalaryDetailsRepository,
        prisma_service_1.PrismaService])
], EmployeeSalaryDetailsService);
//# sourceMappingURL=employee-salary-details.service.js.map