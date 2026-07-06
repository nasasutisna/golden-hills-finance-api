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
exports.EmployeeSalaryHeadersService = void 0;
const common_1 = require("@nestjs/common");
const employee_salary_headers_repository_1 = require("./employee-salary-headers.repository");
const prisma_service_1 = require("../prisma/prisma.service");
const create_employee_salary_header_dto_1 = require("./dto/create-employee-salary-header.dto");
let EmployeeSalaryHeadersService = class EmployeeSalaryHeadersService {
    constructor(repository, prisma) {
        this.repository = repository;
        this.prisma = prisma;
    }
    async create(createEmployeeSalaryHeaderDto) {
        const existing = await this.repository.findByPayrollNumber(createEmployeeSalaryHeaderDto.payrollNumber);
        if (existing) {
            throw new common_1.ConflictException(`Payroll with number ${createEmployeeSalaryHeaderDto.payrollNumber} already exists`);
        }
        const existingPeriod = await this.repository.findByEmployeeAndPeriod(createEmployeeSalaryHeaderDto.employeeId, createEmployeeSalaryHeaderDto.payPeriod);
        if (existingPeriod) {
            throw new common_1.ConflictException(`Salary for employee ${createEmployeeSalaryHeaderDto.employeeId} in period ${createEmployeeSalaryHeaderDto.payPeriod} already exists`);
        }
        const employee = await this.prisma.employee.findFirst({
            where: { id: createEmployeeSalaryHeaderDto.employeeId, deletedAt: null },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with ID ${createEmployeeSalaryHeaderDto.employeeId} not found`);
        }
        return this.repository.create(createEmployeeSalaryHeaderDto);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, status, employeeId, payPeriod, paymentDateFrom, paymentDateTo, search, locked } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (status) {
            where.status = status;
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }
        if (payPeriod) {
            where.payPeriod = payPeriod;
        }
        if (paymentDateFrom || paymentDateTo) {
            where.paymentDate = {};
            if (paymentDateFrom) {
                where.paymentDate.gte = new Date(paymentDateFrom);
            }
            if (paymentDateTo) {
                where.paymentDate.lte = new Date(paymentDateTo);
            }
        }
        if (locked !== undefined) {
            where.locked = locked;
        }
        if (search) {
            where.payrollNumber = { contains: search };
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { payPeriod: 'desc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const header = await this.repository.findById(id);
        if (!header) {
            throw new common_1.NotFoundException(`Employee salary header with ID ${id} not found`);
        }
        return header;
    }
    async update(id, updateEmployeeSalaryHeaderDto) {
        const header = await this.findById(id);
        if (header.locked) {
            throw new common_1.ConflictException('Cannot modify locked payroll');
        }
        return this.repository.update(id, updateEmployeeSalaryHeaderDto);
    }
    async remove(id) {
        const header = await this.findById(id);
        if (header.locked) {
            throw new common_1.ConflictException('Cannot delete locked payroll');
        }
        return this.repository.softDelete(id);
    }
    async calculateSalary(id) {
        const header = await this.findById(id);
        if (header.locked) {
            throw new common_1.ConflictException('Cannot calculate locked payroll');
        }
        if (header.status !== create_employee_salary_header_dto_1.PayrollStatus.DRAFT) {
            throw new common_1.ConflictException('Can only calculate payroll in DRAFT status');
        }
        await this.prisma.$transaction(async (tx) => {
            const details = await tx.employeeSalaryDetail.findMany({
                where: { salaryHeaderId: id },
                include: { component: true },
            });
            let basicSalary = 0;
            let totalAllowances = 0;
            let totalDeductions = 0;
            for (const detail of details) {
                const amount = this.calculateComponentAmount(detail, header);
                const componentType = detail.component.componentType;
                if (componentType === 'BASIC') {
                    basicSalary += amount;
                }
                else if (['ALLOWANCE', 'BONUS', 'OVERTIME'].includes(componentType)) {
                    totalAllowances += amount;
                }
                else if (['DEDUCTION', 'TAX', 'INSURANCE'].includes(componentType)) {
                    totalDeductions += amount;
                }
                await tx.employeeSalaryDetail.update({
                    where: { id: detail.id },
                    data: { amount },
                });
            }
            const netSalary = basicSalary + totalAllowances - totalDeductions;
            await tx.employeeSalaryHeader.update({
                where: { id },
                data: {
                    basicSalary,
                    totalAllowances,
                    totalDeductions,
                    netSalary,
                    status: create_employee_salary_header_dto_1.PayrollStatus.CALCULATED,
                },
            });
        });
        return this.findById(id);
    }
    calculateComponentAmount(detail, header) {
        const component = detail.component;
        const employee = header.employee;
        switch (component.calculationType) {
            case 'FIXED':
                return component.defaultValue || 0;
            case 'PERCENTAGE':
                const baseSalary = employee.basicSalary || 0;
                return (baseSalary * (component.percentageValue || 0)) / 100;
            case 'FORMULA':
                return detail.amount || component.defaultValue || 0;
            default:
                return detail.amount || component.defaultValue || 0;
        }
    }
    async approveSalary(id, approverId) {
        const header = await this.findById(id);
        if (header.locked) {
            throw new common_1.ConflictException('Cannot approve locked payroll');
        }
        if (header.status !== create_employee_salary_header_dto_1.PayrollStatus.CALCULATED) {
            throw new common_1.ConflictException('Can only approve payroll in CALCULATED status');
        }
        const updated = await this.repository.update(id, {
            status: create_employee_salary_header_dto_1.PayrollStatus.APPROVED,
            locked: true,
        });
        await this.prisma.approvalHistory.create({
            data: {
                entityType: 'EMPLOYEE_SALARY',
                entityId: id,
                action: 'APPROVE',
                status: 'APPROVED',
                approvedBy: approverId,
                approvedAt: new Date(),
                comments: 'Payroll approved',
                createdBy: approverId,
            },
        });
        return updated;
    }
    async markAsPaid(id, paymentDate) {
        const header = await this.findById(id);
        if (header.status !== create_employee_salary_header_dto_1.PayrollStatus.APPROVED) {
            throw new common_1.ConflictException('Can only mark approved payroll as paid');
        }
        return this.repository.update(id, {
            status: create_employee_salary_header_dto_1.PayrollStatus.PAID,
            paymentDate: paymentDate || new Date(),
        });
    }
};
exports.EmployeeSalaryHeadersService = EmployeeSalaryHeadersService;
exports.EmployeeSalaryHeadersService = EmployeeSalaryHeadersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_salary_headers_repository_1.EmployeeSalaryHeadersRepository,
        prisma_service_1.PrismaService])
], EmployeeSalaryHeadersService);
//# sourceMappingURL=employee-salary-headers.service.js.map