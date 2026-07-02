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
exports.ResidentInvoicesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ResidentInvoicesRepository = class ResidentInvoicesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy, include } = params;
        const [invoices, total] = await Promise.all([
            this.prisma.residentInvoice.findMany({
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
                    payments: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            paymentNumber: true,
                            amount: true,
                            paymentDate: true,
                            status: true,
                        },
                    },
                },
            }),
            this.prisma.residentInvoice.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { invoices, total };
    }
    async findById(id) {
        const invoice = await this.prisma.residentInvoice.findFirst({
            where: { id, deletedAt: null },
            include: {
                resident: true,
                payments: {
                    where: { deletedAt: null },
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        return invoice;
    }
    async findByInvoiceNumber(invoiceNumber) {
        return this.prisma.residentInvoice.findFirst({
            where: { invoiceNumber, deletedAt: null },
            include: { resident: true },
        });
    }
    async create(data, tx) {
        const prisma = tx || this.prisma;
        return prisma.residentInvoice.create({
            data,
            include: { resident: true },
        });
    }
    async update(id, data, tx) {
        const prisma = tx || this.prisma;
        try {
            return await prisma.residentInvoice.update({
                where: { id },
                data,
                include: { resident: true },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Invoice not found');
            }
            throw error;
        }
    }
    async softDelete(id) {
        return this.update(id, {
            deletedAt: new Date(),
        });
    }
    async count(where) {
        return this.prisma.residentInvoice.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.residentInvoice.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
    async getByResident(residentId) {
        return this.prisma.residentInvoice.findMany({
            where: { residentId, deletedAt: null },
            include: { payments: true },
            orderBy: { invoiceDate: 'desc' },
        });
    }
    async getByStatus(status) {
        return this.prisma.residentInvoice.findMany({
            where: { status, deletedAt: null },
            include: { resident: true },
            orderBy: { dueDate: 'asc' },
        });
    }
    async getOverdueInvoices() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.prisma.residentInvoice.findMany({
            where: {
                status: { in: ['PENDING', 'PARTIAL'] },
                dueDate: { lt: today },
                deletedAt: null,
            },
            include: { resident: true },
            orderBy: { dueDate: 'asc' },
        });
    }
    async getInvoiceStatistics(residentId) {
        const where = { deletedAt: null };
        if (residentId) {
            where.residentId = residentId;
        }
        const [totalInvoices, pendingInvoices, paidInvoices, overdueInvoices, invoices] = await Promise.all([
            this.prisma.residentInvoice.count({ where }),
            this.prisma.residentInvoice.count({
                where: { ...where, status: 'PENDING' },
            }),
            this.prisma.residentInvoice.count({
                where: { ...where, status: 'PAID' },
            }),
            this.prisma.residentInvoice.count({
                where: {
                    ...where,
                    status: { in: ['PENDING', 'PARTIAL'] },
                    dueDate: { lt: new Date() },
                },
            }),
            this.prisma.residentInvoice.findMany({
                where,
                select: {
                    totalAmount: true,
                    paidAmount: true,
                    balanceAmount: true,
                },
            }),
        ]);
        const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
        const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);
        return {
            totalInvoices,
            pendingInvoices,
            paidInvoices,
            overdueInvoices,
            totalAmount,
            totalPaid,
            totalOutstanding,
        };
    }
    async updateInvoiceStatus(invoiceId, status, tx) {
        return this.update(invoiceId, { status }, tx);
    }
    async updatePaymentAmount(invoiceId, paymentAmount, tx) {
        const invoice = await this.findById(invoiceId);
        const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
        const newOutstandingAmount = Number(invoice.totalAmount) - newPaidAmount;
        let newStatus = invoice.status;
        if (newOutstandingAmount <= 0) {
            newStatus = 'PAID';
        }
        else if (newPaidAmount > 0) {
            newStatus = 'PARTIAL';
        }
        return this.update(invoiceId, {
            paidAmount: newPaidAmount,
            balanceAmount: newOutstandingAmount,
            status: newStatus,
        }, tx);
    }
    async generateInvoiceNumber() {
        const count = await this.prisma.residentInvoice.count();
        const timestamp = Date.now().toString().slice(-6);
        return `INV${timestamp}${String(count + 1).padStart(4, '0')}`;
    }
};
exports.ResidentInvoicesRepository = ResidentInvoicesRepository;
exports.ResidentInvoicesRepository = ResidentInvoicesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResidentInvoicesRepository);
//# sourceMappingURL=resident-invoices.repository.js.map