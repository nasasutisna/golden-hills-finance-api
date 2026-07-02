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
exports.EmployeesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EmployeesRepository = class EmployeesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy, include } = params;
        const [employees, total] = await Promise.all([
            this.prisma.employee.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: include || {
                    position: {
                        select: {
                            id: true,
                            positionCode: true,
                            positionName: true,
                            department: true,
                            level: true,
                        },
                    },
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    salaryHeaders: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            payrollNumber: true,
                            periodYear: true,
                            periodMonth: true,
                            totalNetSalary: true,
                            status: true,
                        },
                    },
                    cashAdvances: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            advanceNumber: true,
                            amount: true,
                            status: true,
                        },
                    },
                },
            }),
            this.prisma.employee.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { employees, total };
    }
    async findById(id, include) {
        const employee = await this.prisma.employee.findFirst({
            where: { id, deletedAt: null },
            include: include || {
                position: true,
                role: true,
                user: true,
                salaryHeaders: {
                    where: { deletedAt: null },
                    orderBy: { periodYear: 'desc', periodMonth: 'desc' },
                },
                cashAdvances: {
                    where: { deletedAt: null, status: { in: ['APPROVED', 'DISBURSED', 'PARTIAL'] } },
                    orderBy: { requestDate: 'desc' },
                },
                fileAttachments: true,
            },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        return employee;
    }
    async findByEmployeeCode(employeeCode) {
        return this.prisma.employee.findFirst({
            where: { employeeCode, deletedAt: null },
            include: { position: true, role: true },
        });
    }
    async create(data) {
        return this.prisma.employee.create({
            data,
            include: { position: true, role: true },
        });
    }
    async update(id, data) {
        try {
            return await this.prisma.employee.update({
                where: { id },
                data,
                include: { position: true, role: true },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Employee not found');
            }
            throw error;
        }
    }
    async softDelete(id) {
        return this.update(id, {
            deletedAt: new Date(),
            isActive: false,
            employmentStatus: 'TERMINATED',
            terminationDate: new Date(),
        });
    }
    async restore(id) {
        return this.prisma.employee.update({
            where: { id },
            data: { deletedAt: null, isActive: true },
            include: { position: true, role: true },
        });
    }
    async updatePassword(id, newPassword) {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
            select: { userId: true },
        });
        if (!employee?.userId) {
            return;
        }
        await this.prisma.user.update({
            where: { id: employee.userId },
            data: { password: newPassword },
        });
    }
    async count(where) {
        return this.prisma.employee.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.employee.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
    async getActiveEmployeesCount() {
        return this.prisma.employee.count({
            where: { employmentStatus: 'ACTIVE', deletedAt: null },
        });
    }
    async getByPosition(positionId) {
        return this.prisma.employee.findMany({
            where: { positionId, deletedAt: null },
            include: { position: true, role: true },
            orderBy: { firstName: 'asc' },
        });
    }
    async getByDepartment(department) {
        return this.prisma.employee.findMany({
            where: { deletedAt: null },
            include: { position: true, role: true },
            orderBy: { firstName: 'asc' },
        });
    }
    async getByEmploymentStatus(status) {
        return this.prisma.employee.findMany({
            where: { employmentStatus: status, deletedAt: null },
            include: { position: true },
            orderBy: { firstName: 'asc' },
        });
    }
    async getEmployeeStatistics() {
        const [totalEmployees, activeEmployees, probationEmployees, resignedEmployees, terminatedEmployees, employees] = await Promise.all([
            this.prisma.employee.count({ where: { deletedAt: null } }),
            this.prisma.employee.count({
                where: { employmentStatus: 'ACTIVE', deletedAt: null },
            }),
            this.prisma.employee.count({
                where: { employmentStatus: 'PROBATION', deletedAt: null },
            }),
            this.prisma.employee.count({
                where: { employmentStatus: 'RESIGNED', deletedAt: null },
            }),
            this.prisma.employee.count({
                where: { employmentStatus: 'TERMINATED', deletedAt: null },
            }),
            this.prisma.employee.findMany({
                where: { deletedAt: null },
                include: { position: { select: { department: true } } },
            }),
        ]);
        const byDepartment = {};
        employees.forEach((emp) => {
            const dept = emp.position?.department || 'Unassigned';
            byDepartment[dept] = (byDepartment[dept] || 0) + 1;
        });
        return {
            totalEmployees,
            activeEmployees,
            probationEmployees,
            resignedEmployees,
            terminatedEmployees,
            byDepartment,
        };
    }
    async deactivate(id) {
        return this.update(id, {
            isActive: false,
            employmentStatus: 'RESIGNED',
            terminationDate: new Date(),
        });
    }
    async activate(id) {
        return this.update(id, {
            isActive: true,
            employmentStatus: 'ACTIVE',
            terminationDate: null,
        });
    }
};
exports.EmployeesRepository = EmployeesRepository;
exports.EmployeesRepository = EmployeesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesRepository);
//# sourceMappingURL=employees.repository.js.map