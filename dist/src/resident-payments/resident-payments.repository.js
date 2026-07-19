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
exports.ResidentPaymentsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ResidentPaymentsRepository = class ResidentPaymentsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy, include } = params;
        const [payments, total] = await Promise.all([
            this.prisma.residentPayment.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: include || {
                    resident: {
                        select: {
                            id: true,
                            residentCode: true,
                            firstName: true,
                            lastName: true,
                            unitNumber: true,
                        },
                    },
                    invoice: {
                        select: {
                            id: true,
                            invoiceNumber: true,
                            totalAmount: true,
                            status: true,
                        },
                    },
                },
            }),
            this.prisma.residentPayment.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { payments, total };
    }
    async findById(id) {
        const payment = await this.prisma.residentPayment.findFirst({
            where: { id, deletedAt: null },
            include: {
                resident: true,
                invoice: true,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        return payment;
    }
    async create(data, tx) {
        const prisma = tx || this.prisma;
        return prisma.residentPayment.create({
            data,
            include: { resident: true, invoice: true },
        });
    }
    async update(id, data, tx) {
        const prisma = tx || this.prisma;
        try {
            return await prisma.residentPayment.update({
                where: { id },
                data,
                include: { resident: true, invoice: true },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Payment not found');
            }
            throw error;
        }
    }
    async softDelete(id) {
        return this.update(id, { deletedAt: new Date() });
    }
    async getByResident(residentId) {
        return this.prisma.residentPayment.findMany({
            where: { residentId, deletedAt: null },
            include: { invoice: true },
            orderBy: { paymentDate: 'desc' },
        });
    }
    async getByInvoice(invoiceId) {
        return this.prisma.residentPayment.findMany({
            where: { invoiceId, deletedAt: null },
            include: { resident: true },
            orderBy: { paymentDate: 'desc' },
        });
    }
    async verifyPayment(paymentId, verifiedBy, tx) {
        return this.update(paymentId, {
            status: 'COMPLETED',
            verifiedBy,
            verifiedAt: new Date(),
        }, tx);
    }
    async generatePaymentNumber() {
        const count = await this.prisma.residentPayment.count();
        const timestamp = Date.now().toString().slice(-6);
        return `PAY${timestamp}${String(count + 1).padStart(4, '0')}`;
    }
    async getPaymentStatistics(residentId) {
        const where = { deletedAt: null };
        if (residentId) {
            where.residentId = residentId;
        }
        const [totalPayments, totalAmount] = await Promise.all([
            this.prisma.residentPayment.count({ where }),
            this.prisma.residentPayment.aggregate({
                where,
                _sum: { amount: true },
            }),
        ]);
        return {
            totalPayments,
            totalAmount: Number(totalAmount._sum.amount || 0),
        };
    }
    async count(where) {
        return this.prisma.residentPayment.count({ where: { ...where, deletedAt: null } });
    }
    async exists(id) {
        const count = await this.prisma.residentPayment.count({ where: { id, deletedAt: null } });
        return count > 0;
    }
    async bulkCreate(payments, tx) {
        const prisma = tx || this.prisma;
        const successful = [];
        const failed = [];
        for (const payment of payments) {
            try {
                const created = await prisma.residentPayment.create({
                    data: payment,
                    include: { resident: true, invoice: true },
                });
                successful.push(created);
            }
            catch (error) {
                failed.push({
                    payment,
                    error: error.message || 'Unknown error',
                });
            }
        }
        return { successful, failed };
    }
    async createManyInTransaction(payments, tx) {
        const createdPayments = [];
        for (const payment of payments) {
            const created = await tx.residentPayment.create({
                data: payment,
                include: { resident: true, invoice: true },
            });
            createdPayments.push(created);
        }
        return createdPayments;
    }
    async getMatrixData(year, houseBlockId) {
        const units = await this.prisma.houseUnit.findMany({
            where: { deletedAt: null, ...(houseBlockId ? { houseBlockId } : {}) },
            select: {
                id: true,
                unitCode: true,
                unitNumber: true,
                landArea: true,
                buildingArea: true,
                occupancyStatus: true,
                isActive: true,
                houseBlock: { select: { blockCode: true, blockName: true } },
                residents: {
                    where: { deletedAt: null, isActive: true },
                    select: { id: true, firstName: true, lastName: true, phoneNumber: true },
                    take: 1,
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        const payments = await this.prisma.residentPayment.findMany({
            where: {
                deletedAt: null,
                paymentDate: {
                    gte: new Date(year, 0, 1),
                    lt: new Date(year + 1, 0, 1),
                },
                ...(houseBlockId ? { resident: { houseBlockId } } : {}),
            },
            select: {
                id: true,
                paymentDate: true,
                amount: true,
                status: true,
                resident: { select: { houseUnitId: true } },
            },
        });
        return { units, payments };
    }
};
exports.ResidentPaymentsRepository = ResidentPaymentsRepository;
exports.ResidentPaymentsRepository = ResidentPaymentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResidentPaymentsRepository);
//# sourceMappingURL=resident-payments.repository.js.map