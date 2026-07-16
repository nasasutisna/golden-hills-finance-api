import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as PDFDocument from 'pdfkit';
import { IplPaymentsRepository, IplPaymentWithFiles } from './ipl-payments.repository';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { FileAttachmentsService } from '../file-attachments/file-attachments.service';
import * as path from 'path';
import * as fs from 'fs';
import {
  generateKwitansiFilename,
  moveFile,
  sanitizeFilename,
  ensureDir,
} from './helpers/file-naming.helper';

interface ReceiptData {
  paymentNumber: string;
  receiptNumber: string;
  paymentDate: Date;
  residentName: string;
  residentPhone: string | null;
  blockName: string;
  houseUnitNumber: string;
  periodName: string;
  periodCode: string;
  calculatedAmount: string | number;
  paymentMethod: string;
  referenceNumber: string | null;
  landArea: number;
  iplPercentage: number;
  baseRate: string | number;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
}

@Injectable()
export class IplReceiptsService {
  private readonly logger = new Logger(IplReceiptsService.name);
  private readonly uploadPath: string;
  private readonly companyName: string;
  private readonly companyPhone: string;
  private readonly companyEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly iplPaymentsRepository: IplPaymentsRepository,
    private readonly prisma: PrismaService,
    private readonly fileAttachmentsService: FileAttachmentsService,
  ) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
    this.companyName = this.configService.get<string>('COMPANY_NAME', 'Paguyuban Warga Golden Hills');
    this.companyPhone = this.configService.get<string>('COMPANY_PHONE', '+6282121192344');
    this.companyEmail = this.configService.get<string>('COMPANY_EMAIL', 'paguyuban.wargagoldenhills@gmail.com');

    // Ensure uploads directory exists
    ensureDir(this.uploadPath);
  }

  /**
   * Generate receipt for a single IPL payment
   */
  async generateReceipt(paymentId: string): Promise<string> {
    const payment = await this.iplPaymentsRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'APPROVED') {
      throw new BadRequestException('Can only generate receipt for approved payments');
    }

    // Check if receipt already exists
    const existingReceipt = await this.prisma.fileAttachment.findFirst({
      where: {
        entityType: 'IplPayment',
        entityId: paymentId,
        category: 'RECEIPT',
        deletedAt: null,
      },
    });

    if (existingReceipt) {
      this.logger.log(`Receipt already exists for payment ${payment.paymentNumber}`);
      return existingReceipt.filePath;
    }

    // Get period and house unit info for naming
    const month = payment.period?.month || new Date().getMonth() + 1;
    const year = payment.period?.year || new Date().getFullYear();
    const unitNumber = payment.houseUnit?.unitNumber || 'UNKNOWN';
    const timestamp = new Date(payment.paymentDate).getTime();

    // Generate filename with new format: KWT-{bulan}-{tahun}-IPL-{unit}-{timestamp}
    const filename = generateKwitansiFilename(
      month,
      year,
      unitNumber,
      timestamp,
    );

    // Create folder for house unit
    const sanitizedUnit = sanitizeFilename(unitNumber);
    const unitDir = path.join(this.uploadPath, sanitizedUnit);
    ensureDir(unitDir);

    // Full path for PDF
    const pdfPath = path.join(unitDir, filename);

    // Prepare receipt data
    const receiptData: ReceiptData = {
      paymentNumber: payment.paymentNumber,
      receiptNumber: this.generateReceiptNumber(payment.paymentNumber),
      paymentDate: new Date(payment.paymentDate),
      residentName: payment.resident ? `${payment.resident.firstName} ${payment.resident.lastName}`.trim() : '-',
      residentPhone: payment.resident?.phoneNumber || null,
      blockName: payment.houseUnit?.houseBlock?.blockName || '-',
      houseUnitNumber: payment.houseUnit?.unitNumber || '-',
      periodName: payment.period?.periodName || '-',
      periodCode: payment.period?.periodCode || '-',
      calculatedAmount: payment.calculatedAmount?.toString() || '0',
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      landArea: Number(payment.landArea) || 0,
      iplPercentage: Number(payment.iplPercentage) || 0,
      baseRate: payment.baseRate?.toString() || '0',
      notes: payment.notes,
      approvedBy: payment.approver?.username || null,
      approvedAt: payment.approvedAt,
    };

    // Generate PDF
    await this.createReceiptPdf(receiptData, pdfPath);

    // Save file attachment record
    // Use user ID: submitter ID, approver ID, or fall back to submittedBy/approvedBy fields
    const uploadedById = payment.submitter?.id || payment.approver?.id || payment.submittedBy || payment.approvedBy;

    if (!uploadedById) {
      throw new BadRequestException('Cannot create receipt: No valid user ID found');
    }

    const fileAttachment = await this.fileAttachmentsService.create(
      {
        entityType: 'IplPayment',
        entityId: paymentId,
        fileName: filename,
        filePath: `/uploads/${sanitizedUnit}/${filename}`,
        fileSize: fs.statSync(pdfPath).size,
        mimeType: 'application/pdf',
        category: 'RECEIPT',
        description: `Kwitansi pembayaran IPL ${payment.paymentNumber}`,
      },
      uploadedById,
    );

    this.logger.log(`Receipt generated for payment ${payment.paymentNumber}: ${fileAttachment.filePath}`);
    return fileAttachment.filePath;
  }

  /**
   * Get receipt file path for a payment
   */
  async getReceiptPath(paymentId: string): Promise<string> {
    const receipt = await this.prisma.fileAttachment.findFirst({
      where: {
        entityType: 'IplPayment',
        entityId: paymentId,
        category: 'RECEIPT',
        deletedAt: null,
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found for this payment');
    }

    return receipt.filePath;
  }

  /**
   * Get receipt info for a payment
   * Returns file attachment info with URL
   */
  async getReceiptInfo(paymentId: string) {
    const payment = await this.iplPaymentsRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'APPROVED') {
      throw new BadRequestException('Can only get receipt for approved payments');
    }

    // Check if receipt already exists
    const existingReceipt = await this.prisma.fileAttachment.findFirst({
      where: {
        entityType: 'IplPayment',
        entityId: paymentId,
        category: 'RECEIPT',
        deletedAt: null,
      },
    });

    if (existingReceipt) {
      this.logger.log(`Receipt found for payment ${payment.paymentNumber}`);
      return {
        id: existingReceipt.id,
        fileName: existingReceipt.fileName,
        filePath: existingReceipt.filePath,
        fileSize: existingReceipt.fileSize,
        mimeType: existingReceipt.mimeType,
        category: existingReceipt.category,
        paymentNumber: payment.paymentNumber,
        paymentId: paymentId,
      };
    }

    // Generate new receipt if doesn't exist
    const receiptPath = await this.generateReceipt(paymentId);

    // Get the newly created receipt record
    const newReceipt = await this.prisma.fileAttachment.findFirst({
      where: {
        entityType: 'IplPayment',
        entityId: paymentId,
        category: 'RECEIPT',
        deletedAt: null,
      },
    });

    if (!newReceipt) {
      throw new NotFoundException('Failed to create receipt');
    }

    return {
      id: newReceipt.id,
      fileName: newReceipt.fileName,
      filePath: newReceipt.filePath,
      fileSize: newReceipt.fileSize,
      mimeType: newReceipt.mimeType,
      category: newReceipt.category,
      paymentNumber: payment.paymentNumber,
      paymentId: paymentId,
    };
  }

  /**
   * Create receipt PDF for single payment
   */
  private async createReceiptPdf(data: ReceiptData, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Company Header
        this.drawHeader(doc);

        // Receipt Title
        doc.fontSize(18)
          .font('Helvetica-Bold')
          .text('KWITANSI PEMBAYARAN IPL', { align: 'center' })

        doc.fontSize(10)
          .font('Helvetica')
          .text(`No. Kwitansi: ${data.receiptNumber}`, { align: 'center' })
          .moveDown(1);

        // Receipt Information Box
        this.drawInfoBox(doc, data);

        // Payment Details Table
        this.drawPaymentDetails(doc, data);

        // IPL Calculation Details
        this.drawCalculationDetails(doc, data);

        // Approval Section
        this.drawApprovalSection(doc, data);

        // Footer
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

  /**
   * Draw company header
   */
  private drawHeader(doc: typeof PDFDocument): void {
    doc.fontSize(16)
      .font('Helvetica-Bold')
      .text(this.companyName, { align: 'center' });

    doc.fontSize(9)
      .font('Helvetica')
      .text(`Telp: ${this.companyPhone} | Email: ${this.companyEmail}`, { align: 'center' });

    doc.moveTo(50, doc.y + 5)
      .lineTo(545, doc.y + 5)
      .stroke();

    doc.moveDown(1);
  }

  /**
   * Draw information box for single payment
   */
  private drawInfoBox(doc: typeof PDFDocument, data: ReceiptData): void {
    const boxTop = doc.y;
    const boxLeft = 50;
    const boxWidth = 495;
    const rowHeight = 25;
    const col1Width = 120;
    const col2Width = 160;
    const col3Width = 100;
    const col4Width = 115;

    // Draw box border
    doc.rect(boxLeft, boxTop, boxWidth, 125).stroke();

    // Header row
    doc.rect(boxLeft, boxTop, boxWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
    doc.fillColor('#000')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('TANGGAL', boxLeft + 5, boxTop + 8, { width: col1Width })
      .text('NAMA WARGA', boxLeft + 5 + col1Width, boxTop + 8, { width: col2Width })
      .text('BLOK/NO.', boxLeft + 5 + col1Width + col2Width, boxTop + 8, { width: col3Width })
      .text('NO. PEMBAYARAN', boxLeft + 5 + col1Width + col2Width + col3Width, boxTop + 8, { width: col4Width });

    // Divider lines
    doc.moveTo(boxLeft + col1Width, boxTop).lineTo(boxLeft + col1Width, boxTop + rowHeight).stroke();
    doc.moveTo(boxLeft + col1Width + col2Width, boxTop).lineTo(boxLeft + col1Width + col2Width, boxTop + rowHeight).stroke();
    doc.moveTo(boxLeft + col1Width + col2Width + col3Width, boxTop).lineTo(boxLeft + col1Width + col2Width + col3Width, boxTop + rowHeight).stroke();

    // Data row
    doc.font('Helvetica')
      .fontSize(9)
      .text(this.formatDate(data.paymentDate), boxLeft + 5, boxTop + rowHeight + 8, { width: col1Width })
      .text(data.residentName, boxLeft + 5 + col1Width, boxTop + rowHeight + 8, { width: col2Width })
      .text(`${data.blockName}/${data.houseUnitNumber}`, boxLeft + 5 + col1Width + col2Width, boxTop + rowHeight + 8, { width: col3Width })
      .text(data.paymentNumber, boxLeft + 5 + col1Width + col2Width + col3Width, boxTop + rowHeight + 8, { width: col4Width });

    // Divider lines
    doc.moveTo(boxLeft + col1Width, boxTop + rowHeight).lineTo(boxLeft + col1Width, boxTop + rowHeight * 2).stroke();
    doc.moveTo(boxLeft + col1Width + col2Width, boxTop + rowHeight).lineTo(boxLeft + col1Width + col2Width, boxTop + rowHeight * 2).stroke();
    doc.moveTo(boxLeft + col1Width + col2Width + col3Width, boxTop + rowHeight).lineTo(boxLeft + col1Width + col2Width + col3Width, boxTop + rowHeight * 2).stroke();

    // Second row - Period and Method
    doc.moveTo(boxLeft, boxTop + rowHeight * 2).lineTo(boxLeft + boxWidth, boxTop + rowHeight * 2).stroke();
    doc.font('Helvetica')
      .text(data.periodName, boxLeft + 5, boxTop + rowHeight * 2 + 8, { width: col1Width + col2Width })
      .text(`Metode: ${this.getPaymentMethodLabel(data.paymentMethod)}`, boxLeft + 5 + col1Width + col2Width, boxTop + rowHeight * 2 + 8, { width: col3Width + col4Width });

    if (data.referenceNumber) {
      // Third row - Reference
      doc.moveTo(boxLeft, boxTop + rowHeight * 3).lineTo(boxLeft + boxWidth, boxTop + rowHeight * 3).stroke();
      doc.font('Helvetica')
        .fontSize(9)
        .text(`Ref: ${data.referenceNumber}`, boxLeft + 5, boxTop + rowHeight * 3 + 8, { width: boxWidth - 10 });
    }

    if (data.notes) {
      // Fourth row - Notes
      doc.moveTo(boxLeft, boxTop + rowHeight * 4).lineTo(boxLeft + boxWidth, boxTop + rowHeight * 4).stroke();

      doc.font('Helvetica')
        .fontSize(9)
        .text(`Catatan: ${data.notes}`, boxLeft + 5, boxTop + rowHeight * 4 + 8, { width: boxWidth - 10 });
    }

    // Vertical divider lines for remaining rows
    doc.moveTo(boxLeft + col1Width + col2Width, boxTop + rowHeight * 2).lineTo(boxLeft + col1Width + col2Width, boxTop + rowHeight * 5).stroke();

    doc.y = boxTop + 130;
  }

  /**
   * Draw payment details table for single payment
   */
  private drawPaymentDetails(doc: typeof PDFDocument, data: ReceiptData): void {
    const tableTop = doc.y;
    const tableLeft = 50;
    const tableWidth = 495;

    // Total amount box
    doc.rect(tableLeft, tableTop, tableWidth, 40).fillAndStroke('#f5f5f5', '#000');

    // Base y position for alignment - both texts on same baseline
    const textY = tableTop + 14;

    // Label text (smaller font)
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000')
      .text('TOTAL PEMBAYARAN', tableLeft + 10, textY);

    // Amount text (larger font) - right-aligned with padding
    // Use smaller offset to prevent wrapping/line break
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#006400')
      .text(this.formatCurrency(data.calculatedAmount), -50, textY, { align: 'right' });

    doc.fillColor('#000').y = tableTop + 45;
  }

  /**
   * Draw IPL calculation details
   */
  private drawCalculationDetails(doc: typeof PDFDocument, data: ReceiptData): void {
    const boxTop = doc.y;
    const boxLeft = 50;
    const boxWidth = 495;

    doc.rect(boxLeft, boxTop, boxWidth, 80).stroke();

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000')
      .text('RINCIAN PERHITUNGAN IPL', boxLeft + 10, boxTop + 10);

    doc.fontSize(9)
      .font('Helvetica')
      .text(`Luas Tanah: ${data.landArea} m²`, boxLeft + 10, boxTop + 30)
      .text(`Persentase IPL: ${data.iplPercentage}%`, boxLeft + 10, boxTop + 45)
      .text(`Tarif Dasar: ${this.formatCurrency(data.baseRate)} per m²`, boxLeft + 10, boxTop + 60);

    doc.y = boxTop + 85;
  }

  /**
   * Draw approval section for single payment
   */
  private drawApprovalSection(doc: typeof PDFDocument, data: ReceiptData): void {
    const boxTop = doc.y;
    const boxLeft = 50;
    const boxWidth = 495;

    doc.rect(boxLeft, boxTop, boxWidth, 70).stroke();

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000')
      .text('STATUS PEMBAYARAN', boxLeft + 10, boxTop + 10);

    doc.fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#006400')
      .text('SUDAH DIBAYAR / LUNAS', boxLeft + 10, boxTop + 28);

    if (data.approvedAt && data.approvedBy) {
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#666')
        .text(`Disetujui pada: ${this.formatDateTime(data.approvedAt)}`, boxLeft + 10, boxTop + 42)
        .text(`Oleh: ${data.approvedBy}`, boxLeft + 10, boxTop + 52);
    }

    doc.fillColor('#000').y = boxTop + 65;
  }

  /**
   * Draw footer
   */
  private drawFooter(doc: typeof PDFDocument): void {
    doc.moveTo(50, 730)
      .lineTo(545, 730)
      .stroke();

    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#666')
      .text(
        `Kwitansi ini adalah bukti pembayaran yang sah. Diterbitkan oleh ${this.companyName}`,
        50,
        740,
        { align: 'center', width: 495 },
      )
      .text(
        `Tanggal cetak: ${this.formatDateTime(new Date())}`,
        50,
        752,
        { align: 'center', width: 495 },
      );
  }

  /**
   * Generate receipt number from payment number
   */
  private generateReceiptNumber(paymentNumber: string): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `KW-${timestamp}-${random}`;
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Format date time
   */
  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Get payment method label
   */
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
