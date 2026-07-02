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
exports.ResidentsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ResidentsRepository = class ResidentsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy, include } = params;
        const [residents, total] = await Promise.all([
            this.prisma.resident.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: include || {
                    houseBlock: {
                        select: {
                            id: true,
                            blockCode: true,
                            blockName: true,
                            address: true,
                        },
                    },
                },
            }),
            this.prisma.resident.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { residents, total };
    }
    async findById(id, include) {
        const resident = await this.prisma.resident.findFirst({
            where: { id, deletedAt: null },
            include: include || {
                houseBlock: true,
                residentInvoices: {
                    where: { deletedAt: null },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
                residentPayments: {
                    where: { deletedAt: null },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!resident) {
            throw new common_1.NotFoundException('Resident not found');
        }
        return resident;
    }
    async findByResidentCode(residentCode) {
        return this.prisma.resident.findFirst({
            where: { residentCode, deletedAt: null },
            include: { houseBlock: true },
        });
    }
    async create(data) {
        return this.prisma.resident.create({
            data,
            include: { houseBlock: true },
        });
    }
    async update(id, data) {
        try {
            return await this.prisma.resident.update({
                where: { id },
                data,
                include: { houseBlock: true },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Resident not found');
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
        return this.prisma.resident.update({
            where: { id },
            data: { deletedAt: null, isActive: true },
            include: { houseBlock: true },
        });
    }
    async count(where) {
        return this.prisma.resident.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.resident.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
    async getActiveResidentsCount() {
        return this.prisma.resident.count({
            where: { isActive: true, deletedAt: null },
        });
    }
    async getByHouseBlock(houseBlockId) {
        return this.prisma.resident.findMany({
            where: { houseBlockId, deletedAt: null },
            include: { houseBlock: true },
            orderBy: { unitNumber: 'asc' },
        });
    }
    async updateBalance(residentId) {
        const invoices = await this.prisma.residentInvoice.findMany({
            where: { residentId, deletedAt: null, status: { in: ['PENDING', 'PARTIAL'] } },
        });
        const payments = await this.prisma.residentPayment.findMany({
            where: { residentId, deletedAt: null },
        });
        const totalInvoices = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    }
};
exports.ResidentsRepository = ResidentsRepository;
exports.ResidentsRepository = ResidentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResidentsRepository);
//# sourceMappingURL=residents.repository.js.map