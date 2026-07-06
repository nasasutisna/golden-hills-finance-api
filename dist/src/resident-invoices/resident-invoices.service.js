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
var ResidentInvoicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentInvoicesService = void 0;
const common_1 = require("@nestjs/common");
const resident_invoices_repository_1 = require("./resident-invoices.repository");
const prisma_service_1 = require("../prisma/prisma.service");
let ResidentInvoicesService = ResidentInvoicesService_1 = class ResidentInvoicesService {
    constructor(residentInvoicesRepository, prisma) {
        this.residentInvoicesRepository = residentInvoicesRepository;
        this.prisma = prisma;
        this.logger = new common_1.Logger(ResidentInvoicesService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'invoiceDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (search && searchFields) {
            const fields = searchFields.split(',');
            where.OR = fields.map((field) => ({
                [field]: { contains: search },
            }));
        }
        if (filters) {
            where = { ...where, ...filters };
        }
        const { invoices, total } = await this.residentInvoicesRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: invoices,
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
        return await this.residentInvoicesRepository.findById(id);
    }
    async create(createResidentInvoiceDto) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const invoiceNumber = await this.residentInvoicesRepository.generateInvoiceNumber();
            const subtotal = Number(createResidentInvoiceDto.subtotal);
            const taxAmount = createResidentInvoiceDto.taxAmount
                ? Number(createResidentInvoiceDto.taxAmount)
                : 0;
            const discountAmount = createResidentInvoiceDto.discountAmount
                ? Number(createResidentInvoiceDto.discountAmount)
                : 0;
            const totalAmount = subtotal + taxAmount - discountAmount;
            const invoice = await this.residentInvoicesRepository.create({
                ...createResidentInvoiceDto,
                invoiceNumber,
                totalAmount,
                paidAmount: 0,
                outstandingAmount: totalAmount,
                status: 'PENDING',
            }, tx);
            this.logger.log(`Invoice created: ${invoice.invoiceNumber}`);
            return invoice;
        });
    }
    async update(id, updateResidentInvoiceDto) {
        try {
            const invoice = await this.residentInvoicesRepository.update(id, updateResidentInvoiceDto);
            this.logger.log(`Invoice updated: ${invoice.invoiceNumber}`);
            return invoice;
        }
        catch (error) {
            this.logger.error('Error updating invoice:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const invoice = await this.residentInvoicesRepository.softDelete(id);
        this.logger.log(`Invoice soft deleted: ${invoice.invoiceNumber}`);
        return invoice;
    }
    async getByResident(residentId) {
        return await this.residentInvoicesRepository.getByResident(residentId);
    }
    async getByStatus(status) {
        return await this.residentInvoicesRepository.getByStatus(status);
    }
    async getOverdueInvoices() {
        return await this.residentInvoicesRepository.getOverdueInvoices();
    }
    async getInvoiceStatistics(residentId) {
        return await this.residentInvoicesRepository.getInvoiceStatistics(residentId);
    }
    async markAsPaid(id) {
        return await this.prisma.executeInTransaction(async (tx) => {
            return await this.residentInvoicesRepository.updateInvoiceStatus(id, 'PAID', tx);
        });
    }
    async markAsOverdue(id) {
        return await this.residentInvoicesRepository.updateInvoiceStatus(id, 'OVERDUE');
    }
    async cancelInvoice(id, reason) {
        return await this.prisma.executeInTransaction(async (tx) => {
            return await this.residentInvoicesRepository.update(id, {
                status: 'CANCELLED',
                notes: reason || 'Invoice cancelled',
            }, tx);
        });
    }
    async count(where) {
        return await this.residentInvoicesRepository.count(where);
    }
    async exists(id) {
        return await this.residentInvoicesRepository.exists(id);
    }
};
exports.ResidentInvoicesService = ResidentInvoicesService;
exports.ResidentInvoicesService = ResidentInvoicesService = ResidentInvoicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resident_invoices_repository_1.ResidentInvoicesRepository,
        prisma_service_1.PrismaService])
], ResidentInvoicesService);
//# sourceMappingURL=resident-invoices.service.js.map