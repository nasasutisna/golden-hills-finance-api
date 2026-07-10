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
exports.EmployeeCashAdvancesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EmployeeCashAdvancesRepository = class EmployeeCashAdvancesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [advances, total] = await Promise.all([
            this.prisma.employeeCashAdvance.findMany({
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
                    repayments: true,
                },
            }),
            this.prisma.employeeCashAdvance.count({ where }),
        ]);
        return { advances, total };
    }
    async findById(id) {
        return this.prisma.employeeCashAdvance.findFirst({
            where: { id, deletedAt: null },
            include: {
                employee: {
                    include: {
                        position: true,
                    },
                },
                repayments: true,
            },
        });
    }
    async findByAdvanceNumber(advanceNumber) {
        return this.prisma.employeeCashAdvance.findFirst({
            where: { advanceNumber, deletedAt: null },
        });
    }
    async findByEmployee(employeeId) {
        return this.prisma.employeeCashAdvance.findMany({
            where: { employeeId, deletedAt: null },
            include: {
                employee: true,
                repayments: true,
            },
            orderBy: { requestDate: 'desc' },
        });
    }
    async findPendingApproval() {
        return this.prisma.employeeCashAdvance.findMany({
            where: { status: 'PENDING', deletedAt: null },
            include: {
                employee: true,
            },
            orderBy: { requestDate: 'asc' },
        });
    }
    async create(data) {
        return this.prisma.employeeCashAdvance.create({
            data,
            include: {
                employee: true,
            },
        });
    }
    async update(id, data) {
        const advance = await this.findById(id);
        if (!advance) {
            throw new common_1.NotFoundException(`Employee cash advance with ID ${id} not found`);
        }
        return this.prisma.employeeCashAdvance.update({
            where: { id },
            data,
            include: {
                employee: {
                    include: {
                        position: true,
                    },
                },
                repayments: true,
            },
        });
    }
    async softDelete(id) {
        const advance = await this.findById(id);
        if (!advance) {
            throw new common_1.NotFoundException(`Employee cash advance with ID ${id} not found`);
        }
        return this.prisma.employeeCashAdvance.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async count(where) {
        return this.prisma.employeeCashAdvance.count({ where });
    }
};
exports.EmployeeCashAdvancesRepository = EmployeeCashAdvancesRepository;
exports.EmployeeCashAdvancesRepository = EmployeeCashAdvancesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeCashAdvancesRepository);
//# sourceMappingURL=employee-cash-advances.repository.js.map