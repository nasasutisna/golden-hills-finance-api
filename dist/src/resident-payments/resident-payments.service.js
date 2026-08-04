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
exports.ResidentPaymentsService = exports.RESIDENT_IURAN_MONTHLY_RATE = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const resident_payments_repository_1 = require("./resident-payments.repository");
const resident_invoices_repository_1 = require("../resident-invoices/resident-invoices.repository");
const prisma_service_1 = require("../prisma/prisma.service");
const file_attachments_service_1 = require("../file-attachments/file-attachments.service");
const cash_transactions_service_1 = require("../cash-transactions/cash-transactions.service");
const resident_payment_receipts_service_1 = require("./resident-payment-receipts.service");
const file_naming_helper_1 = require("../ipl-payments/helpers/file-naming.helper");
const delinquent_units_helper_1 = require("../ipl-payments/helpers/delinquent-units.helper");
const fs = require("fs");
const path = require("path");
exports.RESIDENT_IURAN_MONTHLY_RATE = 20000;
let ResidentPaymentsService = ResidentPaymentsService_1 = class ResidentPaymentsService {
    constructor(residentPaymentsRepository, residentInvoicesRepository, prisma, fileAttachmentsService, cashTransactionsService, residentPaymentReceiptsService, eventEmitter) {
        this.residentPaymentsRepository = residentPaymentsRepository;
        this.residentInvoicesRepository = residentInvoicesRepository;
        this.prisma = prisma;
        this.fileAttachmentsService = fileAttachmentsService;
        this.cashTransactionsService = cashTransactionsService;
        this.residentPaymentReceiptsService = residentPaymentReceiptsService;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(ResidentPaymentsService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'paymentDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;
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
    async create(userId, createResidentPaymentDto, proofFileId) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const resident = await tx.resident.findFirst({
                where: { id: createResidentPaymentDto.residentId, deletedAt: null },
                include: { houseUnit: true },
            });
            if (!resident) {
                throw new common_1.BadRequestException('Resident not found');
            }
            let invoice = null;
            if (createResidentPaymentDto.invoiceId) {
                invoice = await this.residentInvoicesRepository.findById(createResidentPaymentDto.invoiceId);
                if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
                    throw new common_1.ConflictException('Cannot create payment for this invoice status');
                }
            }
            const paymentNumber = await this.residentPaymentsRepository.generatePaymentNumber();
            const payment = await this.residentPaymentsRepository.create({
                residentId: createResidentPaymentDto.residentId,
                invoiceId: createResidentPaymentDto.invoiceId || null,
                paymentDate: new Date(createResidentPaymentDto.paymentDate),
                paymentMethod: createResidentPaymentDto.paymentMethod,
                referenceNumber: createResidentPaymentDto.referenceNumber,
                amount: createResidentPaymentDto.amount,
                bankName: createResidentPaymentDto.bankName,
                notes: createResidentPaymentDto.notes,
                paymentNumber,
                status: 'PENDING',
                createdBy: userId,
            }, tx);
            if (invoice) {
                await this.residentInvoicesRepository.updatePaymentAmount(createResidentPaymentDto.invoiceId, Number(createResidentPaymentDto.amount), tx);
            }
            if (proofFileId) {
                await this.linkProofFile(proofFileId, payment.id, resident.houseUnit?.unitNumber || resident.unitNumber || 'UNKNOWN', payment.paymentNumber, payment.referenceNumber, new Date(payment.paymentDate), tx);
            }
            this.logger.log(`Payment created: ${payment.paymentNumber}`);
            return payment;
        });
    }
    async linkProofFile(proofFileId, paymentId, unitNumber, paymentNumber, referenceNumber, paymentDate, tx) {
        const existingFile = await tx.fileAttachment.findUnique({
            where: { id: proofFileId },
        });
        if (!existingFile) {
            this.logger.warn(`Proof file attachment ${proofFileId} not found, skipping rename`);
            return;
        }
        const originalExt = path.extname(existingFile.fileName) || '';
        const sanitizedUnit = (0, file_naming_helper_1.sanitizeFilename)(unitNumber);
        const timestamp = new Date(paymentDate).getTime();
        const refToken = referenceNumber || paymentNumber;
        const newFileName = (0, file_naming_helper_1.generateBuktiTransferFilename)(new Date(paymentDate).getMonth() + 1, new Date(paymentDate).getFullYear(), sanitizedUnit, timestamp, refToken, originalExt);
        const unitDir = path.join('./uploads', sanitizedUnit);
        const newFilePath = path.join(unitDir, newFileName);
        const oldFilePath = existingFile.filePath.startsWith('./')
            ? existingFile.filePath
            : `.${existingFile.filePath}`;
        if (!fs.existsSync(unitDir)) {
            fs.mkdirSync(unitDir, { recursive: true });
        }
        let renamedFilePath = null;
        if (fs.existsSync(oldFilePath)) {
            fs.renameSync(oldFilePath, newFilePath);
            renamedFilePath = newFilePath.replace('./', '/uploads/');
            this.logger.log(`File renamed: ${existingFile.fileName} -> ${newFileName}`);
        }
        await tx.fileAttachment.update({
            where: { id: proofFileId },
            data: {
                entityType: 'ResidentPayment',
                entityId: paymentId,
                fileName: newFileName,
                filePath: renamedFilePath || existingFile.filePath,
            },
        });
    }
    async verifyPayment(id, verifiedBy) {
        const verifiedPayment = await this.prisma.executeInTransaction(async (tx) => {
            const payment = await this.residentPaymentsRepository.findById(id);
            if (payment.status === 'COMPLETED') {
                throw new common_1.BadRequestException('Payment is already verified');
            }
            const updated = await this.residentPaymentsRepository.verifyPayment(id, verifiedBy, tx);
            if (payment.invoiceId) {
                const invoice = await this.residentInvoicesRepository.findById(payment.invoiceId);
                if (invoice.status === 'PAID') {
                    await this.residentInvoicesRepository.updateInvoiceStatus(invoice.id, 'PAID', tx);
                }
            }
            this.logger.log(`Payment verified: ${updated.paymentNumber}`);
            return updated;
        });
        setImmediate(async () => {
            try {
                await this.residentPaymentReceiptsService.generateReceipt(id);
                this.eventEmitter.emit('resident.payment.verified', {
                    paymentId: id,
                    referenceNumber: verifiedPayment.referenceNumber,
                });
                const fullPayment = await this.prisma.residentPayment.findUnique({
                    where: { id },
                    include: { resident: true },
                });
                if (fullPayment) {
                    await this.cashTransactionsService.createFromResidentPayment(fullPayment, verifiedBy);
                }
                this.logger.log(`Receipt & ledger created for verified payment: ${verifiedPayment.paymentNumber}`);
            }
            catch (error) {
                this.logger.error(`Failed to process post-verify side effects for ${verifiedPayment.paymentNumber}:`, error);
            }
        });
        return verifiedPayment;
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
    async createBulk(createBulkDto) {
        return await this.prisma.executeInTransaction(async (tx) => {
            const successful = [];
            const failed = [];
            for (const paymentDto of createBulkDto.payments) {
                try {
                    const invoice = await this.residentInvoicesRepository.findById(paymentDto.invoiceId);
                    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
                        failed.push({
                            payment: paymentDto,
                            error: `Cannot create payment for invoice with status: ${invoice.status}`,
                        });
                        continue;
                    }
                    const paymentNumber = await this.residentPaymentsRepository.generatePaymentNumber();
                    const payment = await this.residentPaymentsRepository.create({
                        ...paymentDto,
                        paymentNumber,
                        status: 'PENDING',
                    }, tx);
                    await this.residentInvoicesRepository.updatePaymentAmount(paymentDto.invoiceId, Number(paymentDto.amount), tx);
                    successful.push(payment);
                    this.logger.log(`Bulk payment created: ${payment.paymentNumber}`);
                }
                catch (error) {
                    failed.push({
                        payment: paymentDto,
                        error: error.message || 'Unknown error',
                    });
                    this.logger.error(`Error in bulk payment creation: ${error.message}`);
                }
            }
            return {
                successful,
                failed,
                total: createBulkDto.payments.length,
                successCount: successful.length,
                failureCount: failed.length,
            };
        });
    }
    async getMatrix(query) {
        const year = query.year ?? new Date().getFullYear();
        const { units, payments } = await this.residentPaymentsRepository.getMatrixData(year, query.houseBlockId);
        const MONTH_NAMES_SHORT = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
        ];
        const toNum = (v) => {
            if (v == null)
                return 0;
            if (typeof v === 'number')
                return v;
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };
        const RATE = exports.RESIDENT_IURAN_MONTHLY_RATE;
        const perUnit = new Map();
        for (const pm of payments) {
            const unitId = pm.resident?.houseUnitId;
            if (!unitId)
                continue;
            let agg = perUnit.get(unitId);
            if (!agg) {
                agg = { totalCompleted: 0, pendingCount: 0, firstCompletedId: null };
                perUnit.set(unitId, agg);
            }
            if (pm.status === 'COMPLETED') {
                agg.totalCompleted += toNum(pm.amount);
                if (!agg.firstCompletedId)
                    agg.firstCompletedId = pm.id;
            }
            else if (pm.status === 'PENDING') {
                agg.pendingCount += 1;
            }
        }
        const monthTotals = new Array(12).fill(0);
        let paidCellCount = 0;
        const sortedUnits = [...units].sort((a, b) => {
            const ba = a.houseBlock?.blockCode ?? '';
            const bb = b.houseBlock?.blockCode ?? '';
            if (ba !== bb)
                return ba.localeCompare(bb);
            return (a.unitNumber ?? '').localeCompare(b.unitNumber ?? '', undefined, { numeric: true });
        });
        const rows = sortedUnits.map((unit, index) => {
            const agg = perUnit.get(unit.id);
            const totalCompleted = agg?.totalCompleted ?? 0;
            const coveredMonths = RATE > 0 ? Math.floor(totalCompleted / RATE) : 0;
            const cappedCovered = Math.min(coveredMonths, 12);
            let paidCount = 0;
            const cells = MONTH_NAMES_SHORT.map((monthName, i) => {
                const month = i + 1;
                if (i < cappedCovered) {
                    paidCount++;
                    monthTotals[i] += RATE;
                    return {
                        month,
                        monthName,
                        status: 'PAID',
                        amount: RATE,
                        paymentId: agg?.firstCompletedId ?? null,
                    };
                }
                return { month, monthName, status: 'UNPAID', paymentId: null };
            });
            const resident = unit.residents?.[0];
            const residentName = resident
                ? [resident.firstName, resident.lastName].filter(Boolean).join(' ').trim() || null
                : null;
            return {
                no: index + 1,
                unitId: unit.id,
                unitCode: unit.unitCode,
                unitNumber: unit.unitNumber,
                blockCode: unit.houseBlock?.blockCode ?? null,
                blockName: unit.houseBlock?.blockName ?? null,
                landArea: toNum(unit.landArea),
                buildingArea: toNum(unit.buildingArea),
                residentId: resident?.id ?? null,
                residentName,
                phoneNumber: resident?.phoneNumber ?? null,
                isActive: unit.isActive,
                monthlyRate: RATE,
                totalPaid: totalCompleted,
                coveredMonths,
                cells,
                paidCount,
                pendingCount: agg?.pendingCount ?? 0,
            };
        });
        paidCellCount = rows.reduce((sum, r) => sum + r.paidCount, 0);
        const grandTotal = monthTotals.reduce((sum, v) => sum + v, 0);
        return {
            year,
            monthlyRate: RATE,
            unitCount: rows.length,
            paidCellCount,
            grandTotal,
            monthTotals,
            rows,
        };
    }
    async getUnitOutstanding(houseUnitId, year = new Date().getFullYear()) {
        const matrix = await this.getMatrix({ year });
        const asOfMonth = (0, delinquent_units_helper_1.computeAsOfMonth)(year);
        const row = matrix.rows.find((r) => r.unitId === houseUnitId);
        if (!row) {
            return {
                unitId: houseUnitId,
                unitNumber: '',
                monthlyRate: exports.RESIDENT_IURAN_MONTHLY_RATE,
                payableMonths: [],
                totalAmount: 0,
                coveredMonths: 0,
                asOfMonth,
                residentName: null,
                blockName: null,
            };
        }
        const payableMonths = [];
        for (const cell of row.cells) {
            if (cell.status !== 'UNPAID')
                continue;
            if (cell.month > asOfMonth)
                continue;
            payableMonths.push({ month: cell.month, year, periodId: null });
        }
        return {
            unitId: row.unitId,
            unitNumber: row.unitNumber,
            monthlyRate: exports.RESIDENT_IURAN_MONTHLY_RATE,
            payableMonths,
            totalAmount: payableMonths.length * exports.RESIDENT_IURAN_MONTHLY_RATE,
            coveredMonths: row.coveredMonths,
            asOfMonth,
            residentName: row.residentName ?? null,
            blockName: row.blockName ?? null,
        };
    }
    async createBotPayment(input) {
        return await this.prisma.executeInTransaction(async (tx) => {
            if (input.monthCount < 1) {
                throw new common_1.BadRequestException('Jumlah bulan iuran tidak valid.');
            }
            const amount = input.monthCount * exports.RESIDENT_IURAN_MONTHLY_RATE;
            const resident = await tx.resident.findFirst({
                where: { id: input.residentId, deletedAt: null },
                include: { houseUnit: true },
            });
            if (!resident) {
                throw new common_1.BadRequestException('Resident not found');
            }
            const paymentNumber = await this.residentPaymentsRepository.generatePaymentNumber();
            const referenceNumber = await this.residentPaymentsRepository.generateReferenceNumber(tx);
            const payment = await this.residentPaymentsRepository.create({
                residentId: input.residentId,
                invoiceId: null,
                paymentDate: input.paymentDate,
                paymentMethod: 'TRANSFER',
                referenceNumber,
                amount,
                paymentNumber,
                status: 'PENDING',
                createdBy: input.submittedByUserId,
                notes: input.notes ??
                    `Pembayaran Iuran Warga via WhatsApp (${input.monthCount} bulan)`,
            }, tx);
            const attachment = await tx.fileAttachment.create({
                data: {
                    entityType: 'ResidentPayment',
                    entityId: payment.id,
                    fileName: input.proofFileName,
                    filePath: input.proofFilePath,
                    fileSize: input.proofFileSize,
                    mimeType: input.proofMimeType,
                    category: 'PAYMENT_PROOF',
                    description: 'Bukti transfer Iuran Warga via WhatsApp',
                    uploadedBy: input.submittedByUserId,
                },
            });
            await this.linkProofFile(attachment.id, payment.id, resident.houseUnit?.unitNumber || resident.unitNumber || 'UNKNOWN', payment.paymentNumber, payment.referenceNumber, new Date(payment.paymentDate), tx);
            this.logger.log(`WA bot iuran payment created: ref ${referenceNumber}, ${input.monthCount} bulan, total ${amount}, by ${input.submittedByUserId}`);
            return payment;
        });
    }
};
exports.ResidentPaymentsService = ResidentPaymentsService;
exports.ResidentPaymentsService = ResidentPaymentsService = ResidentPaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resident_payments_repository_1.ResidentPaymentsRepository,
        resident_invoices_repository_1.ResidentInvoicesRepository,
        prisma_service_1.PrismaService,
        file_attachments_service_1.FileAttachmentsService,
        cash_transactions_service_1.CashTransactionsService,
        resident_payment_receipts_service_1.ResidentPaymentReceiptsService,
        event_emitter_1.EventEmitter2])
], ResidentPaymentsService);
//# sourceMappingURL=resident-payments.service.js.map