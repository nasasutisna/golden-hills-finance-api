import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateResidentPaymentDto } from './dto/create-resident-payment.dto';
import { UpdateResidentPaymentDto } from './dto/update-resident-payment.dto';
import { CreateBulkResidentPaymentDto, BulkPaymentResultDto } from './dto/create-bulk-resident-payment.dto';
import { QueryResidentPaymentMatrixDto } from './dto/query-resident-payment-matrix.dto';
import { ResidentPaymentsRepository } from './resident-payments.repository';
import { ResidentInvoicesRepository } from '../resident-invoices/resident-invoices.repository';
import { PrismaService } from '../prisma/prisma.service';
import { FileAttachmentsService } from '../file-attachments/file-attachments.service';
import { CashTransactionsService } from '../cash-transactions/cash-transactions.service';
import { ResidentPaymentReceiptsService } from './resident-payment-receipts.service';
import { generateBuktiTransferFilename, sanitizeFilename } from '../ipl-payments/helpers/file-naming.helper';
import { computeAsOfMonth } from '../ipl-payments/helpers/delinquent-units.helper';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Fixed monthly Iuran Warga rate, in IDR. The resident-payment matrix models
 * iuran as a flat per-month obligation: a unit's total COMPLETED payments for
 * the year are divided by this rate to determine how many months are covered
 * (then filled sequentially Jan→Des, oldest-unpaid-first — mirroring how the
 * IPL matrix marks months PAID). Partial remainders roll over and combine with
 * future payments naturally, because the *total* is floored, not each payment.
 *
 * Change this value to adjust the iuran rate app-wide.
 */
export const RESIDENT_IURAN_MONTHLY_RATE = 20000;

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
    private readonly eventEmitter: EventEmitter2,
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

        // Receipt now exists → push the WA confirmation to the resident. Emitted
        // BEFORE the ledger post so a ledger failure can't suppress the WA
        // message. The bot's `generateReceipt` is idempotent (a no-op now that
        // we just created it), which keeps receipt generation single-sourced
        // here in the service and avoids the double-create race.
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

  /**
   * Build the read-only house-unit x month resident-payment (Iuran Warga)
   * matrix for a year.
   *
   * Unlike IPL — which stores one payment row per covered period — a resident
   * payment is a single lump-sum record with only a `paymentDate`; there is no
   * per-month "covered period" on the data itself. To present a coverage
   * matrix comparable to IPL, iuran is modelled as a FIXED monthly rate
   * (`RESIDENT_IURAN_MONTHLY_RATE`, Rp20.000): the total COMPLETED amount a
   * unit has paid in the year is divided by the rate to obtain the number of
   * covered months, and those months are filled sequentially from January
   * (oldest-unpaid-first).
   *
   * Examples (rate = 20.000):
   *  - paid 60.000 in the year → floor(60.000/20.000) = 3 → Jan, Feb, Mar PAID
   *  - paid 15.000 then 25.000 → total 40.000 → 2 → Jan, Feb PAID (remainders
   *    combine across payments because the *total* is floored)
   *  - "bayar lagi" (another 20.000) → +1 month → the next sequential month
   *
   * PENDING payments do NOT count toward coverage (not verified yet); they
   * surface as a row-level `pendingCount` badge instead. The matrix is a
   * coverage report, so `grandTotal` / `monthTotals` reflect covered months ×
   * rate, not raw cash received.
   */
  async getMatrix(query: QueryResidentPaymentMatrixDto) {
    const year = query.year ?? new Date().getFullYear();
    const { units, payments } = await this.residentPaymentsRepository.getMatrixData(
      year,
      query.houseBlockId,
    );

    const MONTH_NAMES_SHORT = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    const toNum = (v: any): number => {
      if (v == null) return 0;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const RATE = RESIDENT_IURAN_MONTHLY_RATE;

    // Aggregate per unit: total COMPLETED amount (drives coverage) + number of
    // PENDING payments (row-level badge only — not coverage). A payment from a
    // resident with no unit cannot be placed on a unit row.
    const perUnit = new Map<
      string,
      { totalCompleted: number; pendingCount: number; firstCompletedId: string | null }
    >();
    for (const pm of payments) {
      const unitId = pm.resident?.houseUnitId;
      if (!unitId) continue;
      let agg = perUnit.get(unitId);
      if (!agg) {
        agg = { totalCompleted: 0, pendingCount: 0, firstCompletedId: null };
        perUnit.set(unitId, agg);
      }
      if (pm.status === 'COMPLETED') {
        agg.totalCompleted += toNum(pm.amount);
        if (!agg.firstCompletedId) agg.firstCompletedId = pm.id;
      } else if (pm.status === 'PENDING') {
        agg.pendingCount += 1;
      }
    }

    const monthTotals: number[] = new Array(12).fill(0);
    let paidCellCount = 0;

    // Stable, readable order: block code then numeric unit number.
    const sortedUnits = [...units].sort((a: any, b: any) => {
      const ba = a.houseBlock?.blockCode ?? '';
      const bb = b.houseBlock?.blockCode ?? '';
      if (ba !== bb) return ba.localeCompare(bb);
      return (a.unitNumber ?? '').localeCompare(b.unitNumber ?? '', undefined, { numeric: true });
    });

    const rows = sortedUnits.map((unit: any, index: number) => {
      const agg = perUnit.get(unit.id);
      const totalCompleted = agg?.totalCompleted ?? 0;
      // Number of full months the paid amount covers this year. Anything
      // beyond 12 is overpayment and is not rendered as extra cells (rare for
      // iuran); it still counts in `coveredMonths` for transparency.
      const coveredMonths = RATE > 0 ? Math.floor(totalCompleted / RATE) : 0;
      const cappedCovered = Math.min(coveredMonths, 12);

      let paidCount = 0;
      const cells: any[] = MONTH_NAMES_SHORT.map((monthName, i) => {
        const month = i + 1;
        if (i < cappedCovered) {
          paidCount++;
          monthTotals[i] += RATE;
          return {
            month,
            monthName,
            status: 'PAID' as const,
            amount: RATE,
            paymentId: agg?.firstCompletedId ?? null,
          };
        }
        return { month, monthName, status: 'UNPAID' as const, paymentId: null };
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

  /**
   * Outstanding (payable) Iuran Warga months for a single house unit: every
   * UNPAID month from January up to and including the as-of month of the year —
   * i.e. *tunggakan + bulan berjalan*. Built on top of `getMatrix` (no extra
   * query), so it sees exactly what the admin matrix shows. Used by the WA
   * bot's "Cek/Bayar Iuran Warga" flows.
   *
   * Unlike IPL, Iuran Warga has no period table, so every payable month carries
   * `periodId: null` (coverage is derived from total paid ÷ rate).
   */
  async getUnitOutstanding(
    houseUnitId: string,
    year: number = new Date().getFullYear(),
  ): Promise<{
    unitId: string;
    unitNumber: string;
    monthlyRate: number;
    payableMonths: { month: number; year: number; periodId: null }[];
    totalAmount: number;
    coveredMonths: number;
    asOfMonth: number;
    residentName: string | null;
    blockName: string | null;
  }> {
    const matrix = await this.getMatrix({ year });
    const asOfMonth = computeAsOfMonth(year);
    const row = (matrix.rows as any[]).find((r) => r.unitId === houseUnitId);

    if (!row) {
      return {
        unitId: houseUnitId,
        unitNumber: '',
        monthlyRate: RESIDENT_IURAN_MONTHLY_RATE,
        payableMonths: [],
        totalAmount: 0,
        coveredMonths: 0,
        asOfMonth,
        residentName: null,
        blockName: null,
      };
    }

    const payableMonths: { month: number; year: number; periodId: null }[] = [];
    for (const cell of row.cells as any[]) {
      if (cell.status !== 'UNPAID') continue;
      if (cell.month > asOfMonth) continue; // future month not yet due
      payableMonths.push({ month: cell.month, year, periodId: null });
    }

    return {
      unitId: row.unitId,
      unitNumber: row.unitNumber,
      monthlyRate: RESIDENT_IURAN_MONTHLY_RATE,
      payableMonths,
      totalAmount: payableMonths.length * RESIDENT_IURAN_MONTHLY_RATE,
      coveredMonths: row.coveredMonths,
      asOfMonth,
      residentName: row.residentName ?? null,
      blockName: row.blockName ?? null,
    };
  }

  /**
   * Create a PENDING Iuran Warga payment from the WhatsApp bot. Always TRANSFER
   * with a bukti transfer, always PENDING (an admin verifies the proof before
   * release). Amount is derived from `monthCount × rate` so the rate stays
   * single-sourced in this service.
   *
   * Mirrors `IplPaymentsService.createBotPayment`: resolves resident+unit,
   * generates payment + reference numbers, creates the FileAttachment from the
   * temp file, then renames it to BTF-… under uploads/<unit>/ via
   * `linkProofFile`. Note the submitter field is `createdBy` (IPL uses
   * `submittedBy`).
   */
  async createBotPayment(input: {
    residentId: string;
    monthCount: number;
    paymentDate: Date;
    proofFilePath: string;
    proofFileName: string;
    proofFileSize: number;
    proofMimeType: string;
    submittedByUserId: string;
    notes?: string;
  }) {
    return await this.prisma.executeInTransaction(async (tx) => {
      if (input.monthCount < 1) {
        throw new BadRequestException('Jumlah bulan iuran tidak valid.');
      }
      const amount = input.monthCount * RESIDENT_IURAN_MONTHLY_RATE;

      const resident = await tx.resident.findFirst({
        where: { id: input.residentId, deletedAt: null },
        include: { houseUnit: true },
      });
      if (!resident) {
        throw new BadRequestException('Resident not found');
      }

      const paymentNumber =
        await this.residentPaymentsRepository.generatePaymentNumber();
      const referenceNumber =
        await this.residentPaymentsRepository.generateReferenceNumber(tx);

      const payment = await this.residentPaymentsRepository.create(
        {
          residentId: input.residentId,
          invoiceId: null,
          paymentDate: input.paymentDate,
          paymentMethod: 'TRANSFER',
          referenceNumber,
          amount,
          paymentNumber,
          status: 'PENDING',
          createdBy: input.submittedByUserId,
          notes:
            input.notes ??
            `Pembayaran Iuran Warga via WhatsApp (${input.monthCount} bulan)`,
        },
        tx as any,
      );

      // Create the FileAttachment from the temp file, then rename to BTF-… and
      // link it to the payment (same artifact as the REST path).
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
      await this.linkProofFile(
        attachment.id,
        payment.id,
        resident.houseUnit?.unitNumber || resident.unitNumber || 'UNKNOWN',
        payment.paymentNumber,
        payment.referenceNumber,
        new Date(payment.paymentDate),
        tx,
      );

      this.logger.log(
        `WA bot iuran payment created: ref ${referenceNumber}, ${input.monthCount} bulan, total ${amount}, by ${input.submittedByUserId}`,
      );
      return payment;
    });
  }
}
