import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { FileAttachmentsService } from '../file-attachments/file-attachments.service';
import * as path from 'path';
import * as fs from 'fs';
import {
  generateKwitansiFilename,
  sanitizeFilename,
  ensureDir,
} from '../ipl-payments/helpers/file-naming.helper';

type ReceiptKind = 'RESIDENT' | 'KEGIATAN';

interface ReceiptData {
  paymentNumber: string;
  receiptNumber: string;
  paymentDate: Date;
  residentName: string;
  residentPhone: string | null;
  blockName: string;
  houseUnitNumber: string;
  invoiceNumber: string | null;
  amount: string | number;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  kind: ReceiptKind;
  title: string;
}

@Injectable()
export class ResidentPaymentReceiptsService {
  private readonly logger = new Logger(ResidentPaymentReceiptsService.name);
  private readonly uploadPath: string;
  private readonly companyName: string;
  private readonly companyPhone: string;
  private readonly companyEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly fileAttachmentsService: FileAttachmentsService,
  ) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
    this.companyName = this.configService.get<string>('COMPANY_NAME', 'Paguyuban Warga Golden Hills');
    this.companyPhone = this.configService.get<string>('COMPANY_PHONE', '+6282121192344');
    this.companyEmail = this.configService.get<string>('COMPANY_EMAIL', 'paguyuban.wargagoldenhills@gmail.com');

    ensureDir(this.uploadPath);
  }

  /**
   * Load a resident payment with all relations needed for the receipt.
   */
  private async loadPayment(paymentId: string) {
    const payment = await this.prisma.residentPayment.findFirst({
      where: { id: paymentId, deletedAt: null },
      include: {
        resident: {
          include: {
            houseUnit: { include: { houseBlock: true } },
            houseBlock: true,
          },
        },
        invoice: {
          include: {
            details: { include: { feeType: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Resident payment not found');
    }

    return payment;
  }

  /**
   * Resolve verifier username from verifiedBy id (no FK relation on the model).
   */
  private async resolveVerifierName(verifiedBy: string | null): Promise<string | null> {
    if (!verifiedBy) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: verifiedBy },
      select: { username: true },
    });
    return user?.username || null;
  }

  /**
   * Determine receipt kind from the linked invoice fee types.
   * "Iuran Kegiatan Warga" -> KEGIATAN, otherwise RESIDENT.
   */
  private resolveKind(payment: any): ReceiptKind {
    const isKegiatan = payment.invoice?.details?.some((d: any) =>
      d.feeType?.feeName?.toLowerCase().includes('kegiatan'),
    );
    return isKegiatan ? 'KEGIATAN' : 'RESIDENT';
  }

  /**
   * Generate receipt for a resident payment (idempotent).
   * Called internally by verify flow and IPL approve flow (Opsi B for kegiatan).
   */
  async generateReceipt(paymentId: string): Promise<string> {
    const payment = await this.loadPayment(paymentId);

    // Idempotency: skip if receipt already exists
    const existingReceipt = await this.prisma.fileAttachment.findFirst({
      where: {
        entityType: 'ResidentPayment',
        entityId: paymentId,
        category: 'RECEIPT',
        deletedAt: null,
      },
    });

    if (existingReceipt) {
      this.logger.log(`Receipt already exists for resident payment ${payment.paymentNumber}`);
      return existingReceipt.filePath;
    }

    const kind = this.resolveKind(payment);
    const title = kind === 'KEGIATAN'
      ? 'KWITANSI PEMBAYARAN IURAN KEGIATAN WARGA'
      : 'KWITANSI PEMBAYARAN WARGA';

    // Filename & folder
    const paymentDate = new Date(payment.paymentDate);
    const month = paymentDate.getMonth() + 1;
    const year = paymentDate.getFullYear();
    const unitNumber =
      payment.resident?.houseUnit?.unitNumber ||
      payment.resident?.unitNumber ||
      'UNKNOWN';
    const timestamp = paymentDate.getTime();

    const filename = generateKwitansiFilename(month, year, unitNumber, timestamp, kind);
    const sanitizedUnit = sanitizeFilename(unitNumber);
    const unitDir = path.join(this.uploadPath, sanitizedUnit);
    ensureDir(unitDir);
    const pdfPath = path.join(unitDir, filename);

    const receiptData: ReceiptData = {
      paymentNumber: payment.paymentNumber,
      receiptNumber: this.generateReceiptNumber(payment.paymentNumber),
      paymentDate,
      residentName: payment.resident
        ? `${payment.resident.firstName} ${payment.resident.lastName}`.trim()
        : '-',
      residentPhone: payment.resident?.phoneNumber || null,
      blockName:
        payment.resident?.houseUnit?.houseBlock?.blockName ||
        payment.resident?.houseBlock?.blockName ||
        '-',
      houseUnitNumber: unitNumber,
      invoiceNumber: payment.invoice?.invoiceNumber || null,
      amount: payment.amount?.toString() || '0',
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      notes: payment.notes,
      verifiedBy: await this.resolveVerifierName(payment.verifiedBy),
      verifiedAt: payment.verifiedAt,
      kind,
      title,
    };

    await this.createReceiptPdf(receiptData, pdfPath);

    // Need a user id for the file attachment. Fall back to verifiedBy then createdBy.
    const uploadedById = payment.verifiedBy || payment.createdBy;
    if (!uploadedById) {
      throw new BadRequestException('Cannot create receipt: No valid user ID found');
    }

    const fileAttachment = await this.fileAttachmentsService.create(
      {
        entityType: 'ResidentPayment',
        entityId: paymentId,
        fileName: filename,
        filePath: `/uploads/${sanitizedUnit}/${filename}`,
        fileSize: fs.statSync(pdfPath).size,
        mimeType: 'application/pdf',
        category: 'RECEIPT',
        description: `${title} ${payment.paymentNumber}`,
      },
      uploadedById,
    );

    this.logger.log(
      `Receipt generated for resident payment ${payment.paymentNumber}: ${fileAttachment.filePath}`,
    );
    return fileAttachment.filePath;
  }

  /**
   * Get receipt info for a payment (generates on-demand). Only for completed payments.
   */
  async getReceiptInfo(paymentId: string) {
    const payment = await this.loadPayment(paymentId);

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only get receipt for completed (verified) payments');
    }

    const existing = await this.prisma.fileAttachment.findFirst({
      where: {
        entityType: 'ResidentPayment',
        entityId: paymentId,
        category: 'RECEIPT',
        deletedAt: null,
      },
    });

    if (existing) {
      return {
        id: existing.id,
        fileName: existing.fileName,
        filePath: existing.filePath,
        fileSize: existing.fileSize,
        mimeType: existing.mimeType,
        category: existing.category,
        paymentNumber: payment.paymentNumber,
        paymentId,
      };
    }

    await this.generateReceipt(paymentId);

    const created = await this.prisma.fileAttachment.findFirst({
      where: {
        entityType: 'ResidentPayment',
        entityId: paymentId,
        category: 'RECEIPT',
        deletedAt: null,
      },
    });

    if (!created) {
      throw new NotFoundException('Failed to create receipt');
    }

    return {
      id: created.id,
      fileName: created.fileName,
      filePath: created.filePath,
      fileSize: created.fileSize,
      mimeType: created.mimeType,
      category: created.category,
      paymentNumber: payment.paymentNumber,
      paymentId,
    };
  }

  // ------------------------------------------------------------------
  // PDF rendering
  // ------------------------------------------------------------------

  private async createReceiptPdf(data: ReceiptData, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        this.drawHeader(doc);

        doc.fontSize(16).font('Helvetica-Bold').text(data.title, { align: 'center' });
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`No. Kwitansi: ${data.receiptNumber}`, { align: 'center' })
          .moveDown(1);

        this.drawInfoBox(doc, data);
        this.drawTotalAmount(doc, data);
        this.drawStatusSection(doc, data);
        this.drawFooter(doc);

        // Resolve only once the file is fully flushed to disk
        // (doc 'end' fires before the write stream finishes — racing fs.statSync)
        stream.on('finish', () => resolve());
        stream.on('error', reject);
        doc.on('error', reject);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawHeader(doc: typeof PDFDocument): void {
    doc.fontSize(16).font('Helvetica-Bold').text(this.companyName, { align: 'center' });
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`Telp: ${this.companyPhone} | Email: ${this.companyEmail}`, { align: 'center' });
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(1);
  }

  private drawInfoBox(doc: typeof PDFDocument, data: ReceiptData): void {
    const boxTop = doc.y;
    const boxLeft = 50;
    const boxWidth = 495;
    const rowHeight = 25;
    const col1Width = 120;
    const col2Width = 160;
    const col3Width = 100;
    const col4Width = 115;

    doc.rect(boxLeft, boxTop, boxWidth, 125).stroke();

    // Header row
    doc.rect(boxLeft, boxTop, boxWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
    doc
      .fillColor('#000')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('TANGGAL', boxLeft + 5, boxTop + 8, { width: col1Width })
      .text('NAMA WARGA', boxLeft + 5 + col1Width, boxTop + 8, { width: col2Width })
      .text('BLOK/NO.', boxLeft + 5 + col1Width + col2Width, boxTop + 8, { width: col3Width })
      .text('NO. PEMBAYARAN', boxLeft + 5 + col1Width + col2Width + col3Width, boxTop + 8, {
        width: col4Width,
      });

    doc
      .moveTo(boxLeft + col1Width, boxTop)
      .lineTo(boxLeft + col1Width, boxTop + rowHeight)
      .stroke();
    doc
      .moveTo(boxLeft + col1Width + col2Width, boxTop)
      .lineTo(boxLeft + col1Width + col2Width, boxTop + rowHeight)
      .stroke();
    doc
      .moveTo(boxLeft + col1Width + col2Width + col3Width, boxTop)
      .lineTo(boxLeft + col1Width + col2Width + col3Width, boxTop + rowHeight)
      .stroke();

    // Data row
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(this.formatDate(data.paymentDate), boxLeft + 5, boxTop + rowHeight + 8, { width: col1Width })
      .text(data.residentName, boxLeft + 5 + col1Width, boxTop + rowHeight + 8, { width: col2Width })
      .text(`${data.blockName}/${data.houseUnitNumber}`, boxLeft + 5 + col1Width + col2Width, boxTop + rowHeight + 8, { width: col3Width })
      .text(data.paymentNumber, boxLeft + 5 + col1Width + col2Width + col3Width, boxTop + rowHeight + 8, { width: col4Width });

    doc
      .moveTo(boxLeft + col1Width, boxTop + rowHeight)
      .lineTo(boxLeft + col1Width, boxTop + rowHeight * 2)
      .stroke();
    doc
      .moveTo(boxLeft + col1Width + col2Width, boxTop + rowHeight)
      .lineTo(boxLeft + col1Width + col2Width, boxTop + rowHeight * 2)
      .stroke();
    doc
      .moveTo(boxLeft + col1Width + col2Width + col3Width, boxTop + rowHeight)
      .lineTo(boxLeft + col1Width + col2Width + col3Width, boxTop + rowHeight * 2)
      .stroke();

    // Row 2: invoice number + method
    doc.moveTo(boxLeft, boxTop + rowHeight * 2).lineTo(boxLeft + boxWidth, boxTop + rowHeight * 2).stroke();
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(
        data.invoiceNumber ? `No. Invoice: ${data.invoiceNumber}` : 'Metode Pembayaran',
        boxLeft + 5,
        boxTop + rowHeight * 2 + 8,
        { width: col1Width + col2Width },
      )
      .text(`Metode: ${this.getPaymentMethodLabel(data.paymentMethod)}`, boxLeft + 5 + col1Width + col2Width, boxTop + rowHeight * 2 + 8, { width: col3Width + col4Width });

    // Row 3: reference
    if (data.referenceNumber) {
      doc.moveTo(boxLeft, boxTop + rowHeight * 3).lineTo(boxLeft + boxWidth, boxTop + rowHeight * 3).stroke();
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(`Ref: ${data.referenceNumber}`, boxLeft + 5, boxTop + rowHeight * 3 + 8, { width: boxWidth - 10 });
    }

    // Row 4: notes
    if (data.notes) {
      const notesRow = data.referenceNumber ? 4 : 3;
      doc
        .moveTo(boxLeft, boxTop + rowHeight * notesRow)
        .lineTo(boxLeft + boxWidth, boxTop + rowHeight * notesRow)
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(`Catatan: ${data.notes}`, boxLeft + 5, boxTop + rowHeight * notesRow + 8, { width: boxWidth - 10 });
    }

    doc.moveTo(boxLeft + col1Width + col2Width, boxTop + rowHeight * 2).lineTo(boxLeft + col1Width + col2Width, boxTop + rowHeight * 5).stroke();
    doc.y = boxTop + 130;
  }

  private drawTotalAmount(doc: typeof PDFDocument, data: ReceiptData): void {
    const tableTop = doc.y;
    const tableLeft = 50;
    const tableWidth = 495;

    doc.rect(tableLeft, tableTop, tableWidth, 40).fillAndStroke('#f5f5f5', '#000');
    const textY = tableTop + 14;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('TOTAL PEMBAYARAN', tableLeft + 10, textY);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#006400')
      .text(this.formatCurrency(data.amount), -50, textY, { align: 'right' });

    doc.fillColor('#000').y = tableTop + 45;
  }

  private drawStatusSection(doc: typeof PDFDocument, data: ReceiptData): void {
    const boxTop = doc.y;
    const boxLeft = 50;
    const boxWidth = 495;

    doc.rect(boxLeft, boxTop, boxWidth, 70).stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('STATUS PEMBAYARAN', boxLeft + 10, boxTop + 10);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#006400').text('SUDAH DIBAYAR / LUNAS', boxLeft + 10, boxTop + 28);

    if (data.verifiedAt && data.verifiedBy) {
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666')
        .text(`Diverifikasi pada: ${this.formatDateTime(data.verifiedAt)}`, boxLeft + 10, boxTop + 42)
        .text(`Oleh: ${data.verifiedBy}`, boxLeft + 10, boxTop + 52);
    }

    doc.fillColor('#000').y = boxTop + 65;
  }

  private drawFooter(doc: typeof PDFDocument): void {
    doc.moveTo(50, 730).lineTo(545, 730).stroke();
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666')
      .text(
        `Kwitansi ini adalah bukti pembayaran yang sah. Diterbitkan oleh ${this.companyName}`,
        50,
        740,
        { align: 'center', width: 495 },
      )
      .text(`Tanggal cetak: ${this.formatDateTime(new Date())}`, 50, 752, {
        align: 'center',
        width: 495,
      });
  }

  private generateReceiptNumber(paymentNumber: string): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `KW-${timestamp}-${random}`;
  }

  private formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      CASH: 'Tunai',
      TRANSFER: 'Transfer Bank',
      CARD: 'Kartu Debit/Kredit',
      E_WALLET: 'E-Wallet',
    };
    return labels[method] || method;
  }
}
