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
exports.EmployeeSalaryDetailsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EmployeeSalaryDetailsRepository = class EmployeeSalaryDetailsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [details, total] = await Promise.all([
            this.prisma.employeeSalaryDetail.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    salaryHeader: {
                        include: {
                            employee: {
                                select: {
                                    id: true,
                                    employeeCode: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    component: true,
                },
            }),
            this.prisma.employeeSalaryDetail.count({ where }),
        ]);
        return { details, total };
    }
    async findById(id) {
        return this.prisma.employeeSalaryDetail.findFirst({
            where: { id, deletedAt: null },
            include: {
                salaryHeader: {
                    include: {
                        employee: true,
                    },
                },
                component: true,
            },
        });
    }
    async findBySalaryHeader(salaryHeaderId) {
        return this.prisma.employeeSalaryDetail.findMany({
            where: { salaryHeaderId, deletedAt: null },
            include: {
                component: true,
            },
            orderBy: {
                component: {
                    calculationOrder: 'asc',
                },
            },
        });
    }
    async create(data) {
        return this.prisma.employeeSalaryDetail.create({
            data,
            include: {
                salaryHeader: true,
                component: true,
            },
        });
    }
    async update(id, data) {
        const detail = await this.findById(id);
        if (!detail) {
            throw new common_1.NotFoundException(`Employee salary detail with ID ${id} not found`);
        }
        return this.prisma.employeeSalaryDetail.update({
            where: { id },
            data,
            include: {
                salaryHeader: {
                    include: {
                        employee: true,
                    },
                },
                component: true,
            },
        });
    }
    async softDelete(id) {
        const detail = await this.findById(id);
        if (!detail) {
            throw new common_1.NotFoundException(`Employee salary detail with ID ${id} not found`);
        }
        return this.prisma.employeeSalaryDetail.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async count(where) {
        return this.prisma.employeeSalaryDetail.count({ where });
    }
};
exports.EmployeeSalaryDetailsRepository = EmployeeSalaryDetailsRepository;
exports.EmployeeSalaryDetailsRepository = EmployeeSalaryDetailsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeSalaryDetailsRepository);
//# sourceMappingURL=employee-salary-details.repository.js.map