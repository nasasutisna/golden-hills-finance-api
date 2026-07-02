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
exports.EmployeePositionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EmployeePositionsRepository = class EmployeePositionsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [positions, total] = await Promise.all([
            this.prisma.employeePosition.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: {
                    employees: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            employeeCode: true,
                            firstName: true,
                            lastName: true,
                            employmentStatus: true,
                        },
                    },
                },
            }),
            this.prisma.employeePosition.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { positions, total };
    }
    async findById(id) {
        const position = await this.prisma.employeePosition.findFirst({
            where: { id, deletedAt: null },
            include: { employees: true },
        });
        if (!position) {
            throw new common_1.NotFoundException('Employee position not found');
        }
        return position;
    }
    async findByPositionCode(positionCode) {
        return this.prisma.employeePosition.findFirst({
            where: { positionCode, deletedAt: null },
            include: { employees: true },
        });
    }
    async create(data) {
        return this.prisma.employeePosition.create({
            data,
            include: { employees: true },
        });
    }
    async update(id, data) {
        try {
            return await this.prisma.employeePosition.update({
                where: { id },
                data,
                include: { employees: true },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Employee position not found');
            }
            throw error;
        }
    }
    async softDelete(id) {
        return this.update(id, {
            deletedAt: new Date(),
            isActive: false,
        });
    }
    async restore(id) {
        return this.prisma.employeePosition.update({
            where: { id },
            data: { deletedAt: null, isActive: true },
            include: { employees: true },
        });
    }
    async count(where) {
        return this.prisma.employeePosition.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.employeePosition.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
    async getActivePositions() {
        return this.prisma.employeePosition.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: { level: 'desc' },
        });
    }
    async getByDepartment(department) {
        return this.prisma.employeePosition.findMany({
            where: { department, deletedAt: null },
            orderBy: { level: 'desc' },
        });
    }
};
exports.EmployeePositionsRepository = EmployeePositionsRepository;
exports.EmployeePositionsRepository = EmployeePositionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeePositionsRepository);
//# sourceMappingURL=employee-positions.repository.js.map