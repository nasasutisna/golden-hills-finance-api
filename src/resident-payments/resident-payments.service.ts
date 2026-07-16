import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateResidentPaymentDto } from './dto/create-resident-payment.dto';
import { UpdateResidentPaymentDto } from './dto/update-resident-payment.dto';
import { CreateBulkResidentPaymentDto, BulkPaymentResultDto } from './dto/create-bulk-resident-payment.dto';
import { ResidentPaymentsRepository } from './resident-payments.repository';
import { ResidentInvoicesRepository } from '../resident-invoices/resident-invoices.repository';
import { PrismaService } from '../prisma/prisma.service';
import { FileAttachmentsService } from '../file-attachments/file-attachments.service';
import { CashTransactionsService } from '../cash-transactions/cash-transactions.service';
import { ResidentPaymentReceiptsService } from './resident-payment-receipts.service';
import { generateBuktiTransferFilename, sanitizeFilename } from '../ipl-payments/helpers/file-naming.helper';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ResidentPaymentsService {
  private readonly logger = new Logger(ResidentPaymentsService.name);

  constructor(
    private readonly residentPaymentsRepository: ResidentPaymentsRepository,
    private readonly residentInvoicesRepository: ResidentInvoicesRepository,
    private readonly prisma: PrismaService,
    private readonly fileAttachmentsService: FileAttachmentsService,
    private readonly cashTransactionsService: CashTransactionsService,
    private readonly residentPaymentReceiptsService: ResidentPaymentReceiptsService,
  ) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'paymentDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

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

  async findById(id: string) {
    return await this.residentPaymentsRepository.findById(id);
  }

  async create(
    userId: string,
    createResidentPaymentDto: CreateResidentPaymentDto,
    proofFileId?: string,
  ) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Resolve resident (needed for unit number / file folder)
      const resident = await tx.resident.findFirst({
        where: { id: createResidentPaymentDto.residentId, deletedAt: null },
        include: { houseUnit: true },
      });
      if (!resident) {
        throw new BadRequestException('Resident not found');
      }

      // Optional invoice linkage & paid-amount update
      let invoice: any = null;
      if (createResidentPaymentDto.invoiceId) {
        invoice = await this.residentInvoicesRepository.findById(
          createResidentPaymentDto.invoiceId,
        );

        if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
          throw new ConflictException('Cannot create payment for this invoice status');
        }
      }

      // Generate payment number
      const paymentNumber = await this.residentPaymentsRepository.generatePaymentNumber();

      // Create payment
      const payment = await this.residentPaymentsRepository.create(
        {
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
        },
        tx as any,
      );

      // Update invoice paid amount (only when linked)
      if (invoice) {
        await this.residentInvoicesRepository.updatePaymentAmount(
          createResidentPaymentDto.invoiceId!,
          Number(createResidentPaymentDto.amount),
          tx as any,
        );
      }

      // Rename & link bukti transfer file (if provided)
      if (proofFileId) {
        await this.linkProofFile(
          proofFileId,
          payment.id,
          resident.houseUnit?.unitNumber || resident.unitNumber || 'UNKNOWN',
          payment.paymentNumber,
          payment.referenceNumber,
          new Date(payment.paymentDate),
          tx,
        );
      }

      this.logger.log(`Payment created: ${payment.paymentNumber}`);
      return payment;
    });
  }

  /**
   * Rename the uploaded temp proof file into uploads/{unit}/BTF-... and link it
   * to the resident payment via FileAttachment (category PAYMENT_PROOF).
   */
  private async linkProofFile(
    proofFileId: string,
    paymentId: string,
    unitNumber: string,
    paymentNumber: string,
    referenceNumber: string | null | undefined,
    paymentDate: Date,
    tx: any,
  ): Promise<void> {
    const existingFile = await tx.fileAttachment.findUnique({
      where: { id: proofFileId },
    });

    if (!existingFile) {
      this.logger.warn(`Proof file attachment ${proofFileId} not found, skipping rename`);
      return;
    }

    const originalExt = path.extname(existingFile.fileName) || '';
    const sanitizedUnit = sanitizeFilename(unitNumber);
    const timestamp = new Date(paymentDate).getTime();
    const refToken = referenceNumber || paymentNumber;

    const newFileName = generateBuktiTransferFilename(
      new Date(paymentDate).getMonth() + 1,
      new Date(paymentDate).getFullYear(),
      sanitizedUnit,
      timestamp,
      refToken,
      originalExt,
    );

    const unitDir = path.join('./uploads', sanitizedUnit);
    const newFilePath = path.join(unitDir, newFileName);
    const oldFilePath = existingFile.filePath.startsWith('./')
      ? existingFile.filePath
      : `.${existingFile.filePath}`;

    if (!fs.existsSync(unitDir)) {
      fs.mkdirSync(unitDir, { recursive: true });
    }

    let renamedFilePath: string | null = null;
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

  async verifyPayment(id: string, verifiedBy: string) {
    const verifiedPayment = await this.prisma.executeInTransaction(async (tx) => {
      const payment = await this.residentPaymentsRepository.findById(id);

      if (payment.status === 'COMPLETED') {
        throw new BadRequestException('Payment is already verified');
      }

      const updated = await this.residentPaymentsRepository.verifyPayment(
        id,
        verifiedBy,
        tx as any,
      );

      // Update invoice status only when linked
      if (payment.invoiceId) {
        const invoice = await this.residentInvoicesRepository.findById(payment.invoiceId);
        if (invoice.status === 'PAID') {
          await this.residentInvoicesRepository.updateInvoiceStatus(
            invoice.id,
            'PAID',
            tx as any,
          );
        }
      }

      this.logger.log(`Payment verified: ${updated.paymentNumber}`);
      return updated;
    });

    // Post-commit side effects (receipt + ledger) — must not block the response
    setImmediate(async () => {
      try {
        await this.residentPaymentReceiptsService.generateReceipt(id);

        const fullPayment = await this.prisma.residentPayment.findUnique({
          where: { id },
          include: { resident: true },
        });
        if (fullPayment) {
          await this.cashTransactionsService.createFromResidentPayment(fullPayment, verifiedBy);
        }
        this.logger.log(`Receipt & ledger created for verified payment: ${verifiedPayment.paymentNumber}`);
      } catch (error) {
        this.logger.error(`Failed to process post-verify side effects for ${verifiedPayment.paymentNumber}:`, error);
      }
    });

    return verifiedPayment;
  }

  async update(id: string, updateResidentPaymentDto: UpdateResidentPaymentDto) {
    try {
      const payment = await this.residentPaymentsRepository.update(id, updateResidentPaymentDto);
      this.logger.log(`Payment updated: ${payment.paymentNumber}`);
      return payment;
    } catch (error) {
      this.logger.error('Error updating payment:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const payment = await this.residentPaymentsRepository.softDelete(id);
    this.logger.log(`Payment soft deleted: ${payment.paymentNumber}`);
    return payment;
  }

  async getByResident(residentId: string) {
    return await this.residentPaymentsRepository.getByResident(residentId);
  }

  async getByInvoice(invoiceId: string) {
    return await this.residentPaymentsRepository.getByInvoice(invoiceId);
  }

  async getPaymentStatistics(residentId?: string) {
    return await this.residentPaymentsRepository.getPaymentStatistics(residentId);
  }

  async count(where?: any): Promise<number> {
    return await this.residentPaymentsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.residentPaymentsRepository.exists(id);
  }

  async createBulk(createBulkDto: CreateBulkResidentPaymentDto): Promise<BulkPaymentResultDto> {
    return await this.prisma.executeInTransaction(async (tx) => {
      const successful = [];
      const failed = [];

      // Process each payment
      for (const paymentDto of createBulkDto.payments) {
        try {
          // Check if invoice exists
          const invoice = await this.residentInvoicesRepository.findById(
            paymentDto.invoiceId,
          );

          if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
            failed.push({
              payment: paymentDto,
              error: `Cannot create payment for invoice with status: ${invoice.status}`,
            });
            continue;
          }

          // Generate payment number
          const paymentNumber = await this.residentPaymentsRepository.generatePaymentNumber();

          // Create payment
          const payment = await this.residentPaymentsRepository.create(
            {
              ...paymentDto,
              paymentNumber,
              status: 'PENDING',
            },
            tx as any,
          );

          // Update invoice
          await this.residentInvoicesRepository.updatePaymentAmount(
            paymentDto.invoiceId,
            Number(paymentDto.amount),
            tx as any,
          );

          successful.push(payment);
          this.logger.log(`Bulk payment created: ${payment.paymentNumber}`);
        } catch (error) {
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
}
