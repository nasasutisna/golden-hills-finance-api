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
 * Returns a Node Buffer ready to be sent as an HTTP response.
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

  // ---------------- Sheet 1: Ringkasan ----------------
  const summary = workbook.addWorksheet('Ringkasan');
  summary.columns = [
    { key: 'label', width: 32 },
    { key: 'value', width: 32 },
  ];

  // Title (merged across both columns)
  summary.mergeCells('A1:B1');
  const titleCell = summary.getCell('A1');
  titleCell.value = data.title;
  titleCell.font = TITLE_FONT;
  titleCell.alignment = { horizontal: 'left' };
  summary.getRow(1).height = 24;

  const sumHeader = summary.addRow({ label: 'Keterangan', value: 'Nilai' });
  sumHeader.font = { bold: true };
  sumHeader.fill = HEADER_FILL;
  sumHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  summary.addRow({ label: 'Periode', value: periodLabel || 'Semua periode' });
  summary.addRow({ label: 'Tanggal Export', value: formatDate(new Date()) });
  summary.addRow({});

  const incomeRow = summary.addRow({ label: 'Total Pemasukan', value: data.summary.totalIncome });
  incomeRow.font = { bold: true };
  const expenseRow = summary.addRow({ label: 'Total Pengeluaran', value: data.summary.totalExpense });
  expenseRow.font = { bold: true };
  const balanceRow = summary.addRow({ label: 'Saldo', value: data.summary.balance });
  balanceRow.font = { bold: true };

  summary.getColumn('value').numFmt = CURRENCY_FMT;
  if (data.summary.balance < 0) {
    balanceRow.getCell('value').font = { bold: true, color: { argb: 'FFC62828' } };
  }

  // ---------------- Sheet 2: Detail Transaksi ----------------
  const detail = workbook.addWorksheet('Detail Transaksi');
  detail.columns = [
    { header: 'Tanggal', key: 'date', width: 16 },
    { header: 'No. Transaksi', key: 'number', width: 22 },
    { header: 'Tipe', key: 'type', width: 14 },
    { header: 'Kategori', key: 'category', width: 28 },
    { header: 'Deskripsi', key: 'description', width: 48 },
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
      description: t.description || '-',
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
