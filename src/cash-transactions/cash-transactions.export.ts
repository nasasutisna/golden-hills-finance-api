import * as ExcelJS from 'exceljs';

/**
 * Shape of a single cash transaction row as fetched with category + creator
 * included. Kept structural (instead of the Prisma generated type) so the
 * builder does not need to know the exact include payload typing.
 */
export interface ReportTransaction {
  transactionNumber: string;
  transactionDate: Date | string;
  transactionType: string;
  amount: number | string;
  description?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  /** Originating expense request (when this expense was posted from one). */
  expenseRequest?: {
    title: string;
    description: string | null;
    requestNumber: string;
  } | null;
  status?: string | null;
  category?: { categoryName: string; categoryCode: string } | null;
  creator?: { firstName?: string | null; lastName?: string | null; username?: string | null } | null;
}

export interface ReportCategoryBreakdown {
  categoryName: string;
  categoryCode: string;
  transactionCount: number;
  totalAmount: number;
}

export interface ReportExportData {
  title: string;
  period: { startDate?: string; endDate?: string };
  summary: { totalIncome: number; totalExpense: number; balance: number };
  breakdown: ReportCategoryBreakdown[];
  transactions: ReportTransaction[];
}

const CURRENCY_FMT = '"Rp"#,##0';
const SIGNED_CURRENCY_FMT = '"Rp"#,##0;[Red]"Rp"-#,##0';
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E6B52' },
};
const TITLE_FONT: Partial<ExcelJS.Font> = { bold: true, size: 14, color: { argb: 'FF1E6B52' } };
const SECTION_FONT: Partial<ExcelJS.Font> = { bold: true, size: 12, color: { argb: 'FF1E6B52' } };

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Pemasukan',
  EXPENSE: 'Pengeluaran',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  DRAFT: 'Draf',
};

/**
 * Format a date-ish value into a readable Indonesian date string.
 * Accepts both ISO date-only strings ("YYYY-MM-DD", parsed locally to avoid
 * TZ shift) and Date objects coming from Prisma.
 */
function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '-';
  if (value instanceof Date) {
    return value.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (typeof value === 'string' && value.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function creatorName(t: ReportTransaction): string {
  const c = t.creator;
  if (!c) return '-';
  const full = `${c.firstName || ''} ${c.lastName || ''}`.trim();
  return full || c.username || '-';
}

/**
 * Human-readable purpose of an expense. Prefer the originating expense
 * request's own description/title (the real pengajuan text, not the
 * auto-generated "Pengeluaran REQ-… - title" ledger text); fall back to the
 * ledger description for expenses not tied to a request.
 */
function expenseKeterangan(t: ReportTransaction): string {
  if (t.expenseRequest) {
    const desc = t.expenseRequest.description?.trim();
    const title = t.expenseRequest.title?.trim();
    const parts = [desc, title].filter(Boolean);
    if (parts.length) return parts.join(' — ');
  }
  return t.description?.trim() || '-';
}

/**
 * Apply bold/coloured header styling + freeze the first row of a worksheet.
 */
function styleHeader(ws: ExcelJS.Worksheet): void {
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 22;
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Build a styled .xlsx workbook for a financial report (IPL / Kegiatan).
 * Sheet 1 combines the summary and the itemised expense detail (Rincian
 * Pengeluaran) so the reader sees what each expense was for alongside the
 * totals. Returns a Node Buffer ready to be sent as an HTTP response.
 */
export async function buildReportWorkbook(data: ReportExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Paguyuban Golden Hills';
  workbook.created = new Date();

  const periodLabel = [
    data.period.startDate ? formatDate(data.period.startDate) : null,
    data.period.endDate ? formatDate(data.period.endDate) : null,
  ]
    .filter(Boolean)
    .join(' s/d ');

  const expenseTx = data.transactions.filter((t) => t.transactionType === 'EXPENSE');
  const expenseTotal = expenseTx.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  // ---------------- Sheet 1: Ringkasan + Rincian Pengeluaran ----------------
  const ws = workbook.addWorksheet('Ringkasan');
  const colCount = 8;
  const colWidths = [16, 22, 20, 28, 50, 20, 22, 20];
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Title (merged across all columns)
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = data.title;
  titleCell.font = TITLE_FONT;
  titleCell.alignment = { horizontal: 'left' };
  ws.getRow(1).height = 24;

  // Meta
  ws.getCell(2, 1).value = 'Periode';
  ws.getCell(2, 2).value = periodLabel || 'Semua periode';
  ws.getCell(3, 1).value = 'Tanggal Export';
  ws.getCell(3, 2).value = formatDate(new Date());

  // Summary block
  const sumRows: Array<[string, number]> = [
    ['Total Pemasukan', data.summary.totalIncome],
    ['Total Pengeluaran', data.summary.totalExpense],
    ['Saldo', data.summary.balance],
  ];
  let row = 5;
  for (const [label, value] of sumRows) {
    ws.getCell(row, 1).value = label;
    ws.getCell(row, 1).font = { bold: true };
    ws.getCell(row, 2).value = value;
    ws.getCell(row, 2).font = { bold: true };
    ws.getCell(row, 2).numFmt = CURRENCY_FMT;
    row++;
  }
  if (data.summary.balance < 0) {
    ws.getCell(row - 1, 2).font = { bold: true, color: { argb: 'FFC62828' } };
  }

  // Section header
  row += 1; // blank spacer row
  ws.getCell(row, 1).value = 'Rincian Pengeluaran';
  ws.getCell(row, 1).font = SECTION_FONT;
  row += 1;

  // Expense table header
  const headerRow = row;
  const headers = [
    'Tanggal',
    'No. Transaksi',
    'No. Pengajuan',
    'Kategori',
    'Keterangan (Untuk Apa)',
    'Status',
    'Dibuat Oleh',
    'Jumlah',
  ];
  headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  ws.getRow(headerRow).height = 22;

  // Expense rows
  row += 1;
  const firstDataRow = row;
  for (const t of expenseTx) {
    ws.getCell(row, 1).value = formatDate(t.transactionDate);
    ws.getCell(row, 2).value = t.transactionNumber;
    ws.getCell(row, 3).value = t.expenseRequest?.requestNumber || '-';
    ws.getCell(row, 4).value = t.category?.categoryName || '-';
    ws.getCell(row, 5).value = expenseKeterangan(t);
    ws.getCell(row, 6).value = (t.status && STATUS_LABELS[t.status]) || t.status || '-';
    ws.getCell(row, 7).value = creatorName(t);
    ws.getCell(row, 8).value = Math.abs(Number(t.amount));
    ws.getCell(row, 8).numFmt = CURRENCY_FMT;
    row++;
  }
  const lastDataRow = row - 1;

  // Total / empty-state row
  if (expenseTx.length > 0) {
    ws.mergeCells(row, 1, row, 7);
    ws.getCell(row, 1).value = 'TOTAL PENGGELUARAN';
    ws.getCell(row, 1).font = { bold: true };
    ws.getCell(row, 1).alignment = { horizontal: 'right' };
    ws.getCell(row, 8).value = expenseTotal;
    ws.getCell(row, 8).font = { bold: true };
    ws.getCell(row, 8).numFmt = CURRENCY_FMT;
  } else {
    ws.mergeCells(row, 1, row, colCount);
    ws.getCell(row, 1).value = 'Tidak ada pengeluaran pada periode ini';
    ws.getCell(row, 1).font = { italic: true };
  }

  ws.views = [{ state: 'frozen', ySplit: headerRow }];
  if (expenseTx.length > 0) {
    ws.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: lastDataRow, column: colCount },
    };
  }

  // ---------------- Sheet 2: Detail Transaksi ----------------
  const detail = workbook.addWorksheet('Detail Transaksi');
  detail.columns = [
    { header: 'Tanggal', key: 'date', width: 16 },
    { header: 'No. Transaksi', key: 'number', width: 22 },
    { header: 'Tipe', key: 'type', width: 14 },
    { header: 'Kategori', key: 'category', width: 28 },
    { header: 'Keterangan', key: 'description', width: 48 },
    { header: 'Tipe Referensi', key: 'reference', width: 20 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Dibuat Oleh', key: 'creator', width: 22 },
    { header: 'Jumlah', key: 'amount', width: 20 },
  ];

  for (const t of data.transactions) {
    const signedAmount =
      t.transactionType === 'EXPENSE' ? -Math.abs(Number(t.amount)) : Math.abs(Number(t.amount));
    detail.addRow({
      date: formatDate(t.transactionDate),
      number: t.transactionNumber,
      type: TRANSACTION_TYPE_LABELS[t.transactionType] || t.transactionType,
      category: t.category?.categoryName || '-',
      description: expenseKeterangan(t),
      reference: t.referenceType || '-',
      status: (t.status && STATUS_LABELS[t.status]) || t.status || '-',
      creator: creatorName(t),
      amount: signedAmount,
    });
  }

  styleHeader(detail);
  detail.getColumn('amount').numFmt = SIGNED_CURRENCY_FMT;
  detail.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: detail.columnCount },
  };

  // Net total row
  if (data.transactions.length > 0) {
    const totalRow = detail.addRow({ date: 'TOTAL', amount: data.summary.balance });
    totalRow.font = { bold: true };
    totalRow.getCell('amount').numFmt = SIGNED_CURRENCY_FMT;
    if (data.summary.balance < 0) {
      totalRow.getCell('amount').font = { bold: true, color: { argb: 'FFC62828' } };
    }
  }

  // ---------------- Sheet 3: Rincian per Kategori ----------------
  const breakdown = workbook.addWorksheet('Rincian per Kategori');
  breakdown.columns = [
    { header: 'Kategori', key: 'category', width: 32 },
    { header: 'Kode', key: 'code', width: 18 },
    { header: 'Jumlah Transaksi', key: 'count', width: 18 },
    { header: 'Total', key: 'total', width: 22 },
  ];

  for (const b of data.breakdown) {
    breakdown.addRow({
      category: b.categoryName,
      code: b.categoryCode,
      count: b.transactionCount,
      total: b.totalAmount,
    });
  }
  styleHeader(breakdown);
  breakdown.getColumn('total').numFmt = CURRENCY_FMT;
  breakdown.getColumn('count').numFmt = '#,##0';
  breakdown.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: breakdown.columnCount },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
