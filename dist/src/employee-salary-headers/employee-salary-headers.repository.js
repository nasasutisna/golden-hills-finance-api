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
exports.EmployeeSalaryHeadersRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EmployeeSalaryHeadersRepository = class EmployeeSalaryHeadersRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [headers, total] = await Promise.all([
            this.prisma.employeeSalaryHeader.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    employee: {
                        select: {
                            id: true,
                            employeeCode: true,
                            firstName: true,
                            lastName: true,
                            position: {
                                select: {
                                    id: true,
                                    positionName: true,
                                },
                            },
                        },
                    },
                    details: {
                        include: {
                            component: true,
                        },
                    },
                },
            }),
            this.prisma.employeeSalaryHeader.count({ where }),
        ]);
        return { headers, total };
    }
    async findById(id) {
        return this.prisma.employeeSalaryHeader.findFirst({
            where: { id, deletedAt: null },
            include: {
                employee: {
                    include: {
                        position: true,
                    },
                },
                details: {
                    include: {
                        component: true,
                    },
                },
            },
        });
    }
    async findByPayrollNumber(payrollNumber) {
        return this.prisma.employeeSalaryHeader.findFirst({
            where: { payrollNumber, deletedAt: null },
        });
    }
    async findByEmployeeAndPeriod(employeeId, payPeriod) {
        return this.prisma.employeeSalaryHeader.findFirst({
            where: { employeeId, payPeriod, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.employeeSalaryHeader.create({
            data,
            include: {
                employee: true,
            },
        });
    }
    async update(id, data) {
        const header = await this.findById(id);
        if (!header) {
            throw new common_1.NotFoundException(`Employee salary header with ID ${id} not found`);
        }
        return this.prisma.employeeSalaryHeader.update({
            where: { id },
            data,
            include: {
                employee: {
                    include: {
                        position: true,
                    },
                },
                details: {
                    include: {
                        component: true,
                    },
                },
            },
        });
    }
    async softDelete(id) {
        const header = await this.findById(id);
        if (!header) {
            throw new common_1.NotFoundException(`Employee salary header with ID ${id} not found`);
        }
        return this.prisma.employeeSalaryHeader.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async count(where) {
        return this.prisma.employeeSalaryHeader.count({ where });
    }
};
exports.EmployeeSalaryHeadersRepository = EmployeeSalaryHeadersRepository;
exports.EmployeeSalaryHeadersRepository = EmployeeSalaryHeadersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeSalaryHeadersRepository);
//# sourceMappingURL=employee-salary-headers.repository.js.map