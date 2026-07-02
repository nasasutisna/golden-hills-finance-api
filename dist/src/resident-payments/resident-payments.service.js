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
var ResidentPaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const resident_payments_repository_1 = require("./resident-payments.repository");
const resident_invoices_repository_1 = require("../resident-invoices/resident-invoices.repository");
const prisma_service_1 = require("../prisma/prisma.service");
let ResidentPaymentsService = ResidentPaymentsService_1 = class ResidentPaymentsService {
    constructor(residentPaymentsRepository, residentInvoicesRepository, prisma) {
        this.residentPaymentsRepository = residentPaymentsRepository;
        this.residentInvoicesRepository = residentInvoicesRepository;
        this.prisma = prisma;
        this.logger = new common_1.Logger(ResidentPaymentsService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'paymentDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (search && searchFields) {
            const fields = searchFields.split(',');
            where.OR = fields.map((field) => ({
                [field]: { contains: search, mode: 'insensitive' },
            }));
        }
        if (filters) {
            where = { ...where, ...filters };
        }
        const { payments, total } = await this.residentPaymentsRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: payments,
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    async findById(id) {
        return await this.residentPaymentsRepository.findById(id);
    }
    async create(createResidentPaymentDto) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const invoice = await this.residentInvoicesRepository.findById(createResidentPaymentDto.invoiceId);
            if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
                throw new common_1.ConflictException('Cannot create payment for this invoice status');
            }
            const paymentNumber = await this.residentPaymentsRepository.generatePaymentNumber();
            const payment = await this.residentPaymentsRepository.create({
                ...createResidentPaymentDto,
                paymentNumber,
                status: 'PENDING',
            }, tx);
            await this.residentInvoicesRepository.updatePaymentAmount(createResidentPaymentDto.invoiceId, Number(createResidentPaymentDto.amount), tx);
            this.logger.log(`Payment created: ${payment.paymentNumber}`);
            return payment;
        });
    }
    async verifyPayment(id, verifiedBy) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const payment = await this.residentPaymentsRepository.findById(id);
            if (!payment.invoiceId) {
                throw new common_1.BadRequestException('Payment is not linked to an invoice');
            }
            const verifiedPayment = await this.residentPaymentsRepository.verifyPayment(id, verifiedBy, tx);
            const invoice = await this.residentInvoicesRepository.findById(payment.invoiceId);
            if (invoice.status === 'PAID') {
                await this.residentInvoicesRepository.updateInvoiceStatus(invoice.id, 'PAID', tx);
            }
            this.logger.log(`Payment verified: ${verifiedPayment.paymentNumber}`);
            return verifiedPayment;
        });
    }
    async update(id, updateResidentPaymentDto) {
        try {
            const payment = await this.residentPaymentsRepository.update(id, updateResidentPaymentDto);
            this.logger.log(`Payment updated: ${payment.paymentNumber}`);
            return payment;
        }
        catch (error) {
            this.logger.error('Error updating payment:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const payment = await this.residentPaymentsRepository.softDelete(id);
        this.logger.log(`Payment soft deleted: ${payment.paymentNumber}`);
        return payment;
    }
    async getByResident(residentId) {
        return await this.residentPaymentsRepository.getByResident(residentId);
    }
    async getByInvoice(invoiceId) {
        return await this.residentPaymentsRepository.getByInvoice(invoiceId);
    }
    async getPaymentStatistics(residentId) {
        return await this.residentPaymentsRepository.getPaymentStatistics(residentId);
    }
    async count(where) {
        return await this.residentPaymentsRepository.count(where);
    }
    async exists(id) {
        return await this.residentPaymentsRepository.exists(id);
    }
};
exports.ResidentPaymentsService = ResidentPaymentsService;
exports.ResidentPaymentsService = ResidentPaymentsService = ResidentPaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resident_payments_repository_1.ResidentPaymentsRepository,
        resident_invoices_repository_1.ResidentInvoicesRepository,
        prisma_service_1.PrismaService])
], ResidentPaymentsService);
//# sourceMappingURL=resident-payments.service.js.map