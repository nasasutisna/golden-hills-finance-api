/**
 * Build the "Daftar Unit Menunggak IPL" report PDF as an in-memory Buffer.
 *
 * Uses pdfkit (already a backend dependency for IPL receipts). Output goes to a
 * buffer (collected via `data`/`end` events) so the controller can stream it
 * straight to the HTTP response with `res.send(buffer)` — mirrors the
 * Excel-export pattern in `cash-transactions.controller.ts`.
 */
import * as PDFDocument from 'pdfkit';
import {
  DelinquentReport,
  DelinquentUnit,
  MONTH_NAMES_LONG_ID,
} from './delinquent-units.helper';

export interface ReportPdfOptions {
  organizationName?: string;
  organizationContact?: string;
  blockLabel?: string;
  printedAt?: Date;
}

/** Page geometry (A4 landscape, pt). */
const PAGE = { width: 841.89, height: 595.28 };
const MARGIN = 40;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

// Column definitions: key + header label + width (pt) + align.
const COLUMNS: { key: string; label: string; width: number; align: 'left' | 'right' | 'center' }[] = [
  { key: 'no', label: 'No', width: 30, align: 'center' },
  { key: 'block', label: 'Blok', width: 65, align: 'left' },
  { key: 'unit', label: 'No Unit', width: 60, align: 'left' },
  { key: 'owner', label: 'Nama Pemilik', width: 195, align: 'left' },
  { key: 'start', label: 'Menunggak Sejak', width: 105, align: 'left' },
  { key: 'end', label: 's/d', width: 105, align: 'left' },
  { key: 'count', label: 'Jml Bln', width: 55, align: 'center' },
  { key: 'obligation', label: 'Keterangan', width: 142, align: 'left' },
];

const HEADER_FILL = '#f0f0f0';
const ZEBRA_FILL = '#fafafa';
const LINE_COLOR = '#cccccc';
const TEXT_COLOR = '#1f2937';

function cellText(
  unit: DelinquentUnit,
  year: number,
  key: string,
): string {
  switch (key) {
    case 'no':
      return String(unit.no);
    case 'block':
      return unit.blockCode ?? unit.blockName ?? '-';
    case 'unit':
      return unit.unitNumber || unit.unitCode || '-';
    case 'owner':
      return unit.residentName ?? '- (Kosong)';
    case 'start':
      return MONTH_NAMES_LONG_ID[unit.streakStartMonth - 1];
    case 'end':
      return `${MONTH_NAMES_LONG_ID[unit.asOfMonth - 1]} ${year}`;
    case 'count':
      return String(unit.streakCount);
    case 'obligation':
      return unit.obligationLabel || '-';
    default:
      return '';
  }
}

export function buildDelinquentReportPdf(
  report: DelinquentReport,
  options: ReportPdfOptions = {},
): Promise<Buffer> {
  const printedAt = options.printedAt ?? new Date();
  const orgName = options.organizationName ?? 'Paguyuban Warga Golden Hills';
  const orgContact = options.organizationContact ?? '';
  const blockLabel = options.blockLabel ?? 'Semua Blok';

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [PAGE.width, PAGE.height],
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      bufferPages: true,
    });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ---- Header (org identity) ----
    doc
      .fillColor(TEXT_COLOR)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(orgName, { align: 'center' });
    if (orgContact) {
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(orgContact, { align: 'center' });
    }
    doc
      .moveTo(MARGIN, doc.y + 4)
      .lineTo(PAGE.width - MARGIN, doc.y + 4)
      .strokeColor(LINE_COLOR)
      .stroke();

    // ---- Title block ----
    doc
      .fillColor(TEXT_COLOR)
      .fontSize(15)
      .font('Helvetica-Bold')
      .text('DAFTAR UNIT MENUNGGAK IPL', { align: 'center' });
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#374151')
      .text(
        report.asOfLabel
          ? `Periode s/d ${report.asOfLabel}  ·  ${blockLabel}  ·  ${report.count} unit menunggak`
          : `${blockLabel}  ·  ${report.count} unit menunggak`,
        { align: 'center' },
      );
    doc
      .fillColor('#6b7280')
      .text(`Dicetak: ${formatDateTime(printedAt)}`, { align: 'center' });
    doc.moveDown(1);

    // ---- Table ----
    drawTable(doc, report);

    // ---- Footer page numbers (buffered) ----
    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    for (let i = range.start; i < range.start + pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
        .fillColor('#9ca3af')
        .font('Helvetica')
        .text(
          `Halaman ${i - range.start + 1} dari ${pageCount}`,
          MARGIN,
          PAGE.height - 24,
          { width: CONTENT_WIDTH, align: 'center' },
        );
    }

    doc.end();
  });
}

const ROW_PADDING = 4;
const ROW_MIN_HEIGHT = 20;
const HEADER_HEIGHT = 22;

function drawTable(doc: typeof PDFDocument, report: DelinquentReport): void {
  const top = doc.y;
  const bottomLimit = PAGE.height - MARGIN - 16; // leave room for footer

  const drawHeaderRow = (y: number): number => {
    doc
      .rect(MARGIN, y, CONTENT_WIDTH, HEADER_HEIGHT)
      .fillAndStroke(HEADER_FILL, LINE_COLOR);
    let x = MARGIN;
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(TEXT_COLOR);
    for (const col of COLUMNS) {
      doc.text(
        col.label,
        x + 4,
        y + 7,
        { width: col.width - 8, align: col.align === 'right' ? 'right' : col.align },
      );
      x += col.width;
    }
    return y + HEADER_HEIGHT;
  };

  let y = drawHeaderRow(top);

  if (report.units.length === 0) {
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(
        'Tidak ada unit menunggak untuk periode & filter ini.',
        MARGIN,
        y + 10,
        { width: CONTENT_WIDTH, align: 'center' },
      );
    return;
  }

  report.units.forEach((unit, index) => {
    // Compute the height needed for this row (long owner names wrap).
    doc.fontSize(8).font('Helvetica');
    const ownerHeight = doc.heightOfString(cellText(unit, report.year, 'owner'), {
      width: COLUMNS[3].width - 8,
    });
    const rowHeight = Math.max(ROW_MIN_HEIGHT, ownerHeight + ROW_PADDING * 2);

    // Page break before drawing a row that would overflow.
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = MARGIN;
      y = drawHeaderRow(y);
    }

    const zebra = index % 2 === 1;
    if (zebra) {
      doc
        .rect(MARGIN, y, CONTENT_WIDTH, rowHeight)
        .fill(ZEBRA_FILL);
    }

    // Cell text + vertical grid.
    let x = MARGIN;
    doc.fontSize(8).font('Helvetica').fillColor(TEXT_COLOR);
    for (const col of COLUMNS) {
      const value = cellText(unit, report.year, col.key);
      doc.text(value, x + 4, y + ROW_PADDING, {
        width: col.width - 8,
        align: col.align === 'right' ? 'right' : col.align,
      });
      x += col.width;
    }

    // Borders (stroke on top of zebra fill).
    doc
      .rect(MARGIN, y, CONTENT_WIDTH, rowHeight)
      .strokeColor(LINE_COLOR)
      .stroke();
    // Vertical column separators.
    let vx = MARGIN;
    for (let i = 0; i < COLUMNS.length - 1; i++) {
      vx += COLUMNS[i].width;
      doc
        .moveTo(vx, y)
        .lineTo(vx, y + rowHeight)
        .strokeColor(LINE_COLOR)
        .stroke();
    }

    y += rowHeight;
  });
}

function formatDateTime(d: Date): string {
  const months = MONTH_NAMES_LONG_ID;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
