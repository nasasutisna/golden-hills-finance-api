/**
 * Delinquent-units computation for the IPL payment matrix.
 *
 * Pure helpers — no Prisma, no I/O. They run on top of the matrix rows already
 * built by `IplPaymentsService.getMatrix()`, so there is no extra DB query.
 *
 * Rule (agreed with product):
 *  - A unit is "delinquent" when it has a trailing streak of ≥ MIN_STREAK
 *    consecutive UNPAID months ENDING at the as-of month of the selected year.
 *  - Only UNPAID cells extend the streak. PAID and PENDING both break it
 *    (PENDING = "Proses", the resident has engaged — not chased as belum bayar).
 *  - Only ACTIVE units are considered (inactive / bank-buyback units are faded
 *    in the matrix and excluded from the collection list).
 *  - Units with 0% IPL obligation are excluded — they have no payment duty
 *    (e.g. the house is not yet occupied, so nobody is liable). Unpaid months
 *    for them are not "menunggak", and they must not be chased or nagged.
 *  - As-of month: `year < currentYear → 12`, `year > currentYear → 0`
 *    (nothing elapsed yet → no delinquents), else the current calendar month.
 */

/** Minimum trailing UNPAID streak to be flagged delinquent. */
export const MIN_STREAK = 3;

export const MONTH_NAMES_LONG_ID: string[] = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export type CellStatus = 'PAID' | 'PENDING' | 'UNPAID';

/** Structural view of a matrix row — matches `IplPaymentsService.getMatrix` output. */
export interface MatrixRowLike {
  no: number;
  unitId: string;
  unitCode: string;
  unitNumber: string;
  blockCode?: string | null;
  blockName?: string | null;
  residentName?: string | null;
  phoneNumber?: string | null;
  obligationLabel?: string | null;
  monthlyRate?: number | null;
  isActive: boolean;
  cells: { month: number; status: CellStatus }[];
}

export interface DelinquentUnit {
  no: number;
  unitId: string;
  blockCode: string | null;
  blockName: string | null;
  unitNumber: string;
  unitCode: string;
  residentName: string | null;
  phoneNumber: string | null;
  /** First unpaid month of the trailing streak (1..12). */
  streakStartMonth: number;
  /** Last month of the streak = the as-of month. */
  asOfMonth: number;
  /** Length of the trailing UNPAID streak. */
  streakCount: number;
  obligationLabel: string;
  monthlyRate: number | null;
}

export interface DelinquentReport {
  year: number;
  asOfMonth: number;
  /** Human label of the as-of month, e.g. "Juli 2026" (undefined when nothing elapsed). */
  asOfLabel: string | null;
  houseBlockId?: string | null;
  count: number;
  units: DelinquentUnit[];
}

/**
 * As-of month (1..12) for the selected year, or 0 when the year hasn't started
 * elapsing (future year → no delinquents possible).
 */
export function computeAsOfMonth(year: number, now: Date = new Date()): number {
  const currentYear = now.getFullYear();
  if (year < currentYear) return 12;
  if (year > currentYear) return 0;
  return now.getMonth() + 1; // JS months are 0-based
}

/**
 * Walk back from the as-of month while the cell is UNPAID; return the streak
 * length (0 when as-of month itself is not UNPAID, or as-of month is 0).
 */
function trailingUnpaidStreak(row: MatrixRowLike, asOfMonth: number): number {
  if (asOfMonth < 1) return 0;
  let streak = 0;
  for (let month = asOfMonth; month >= 1; month--) {
    const cell = row.cells.find((c) => c.month === month);
    if (cell?.status === 'UNPAID') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Derive the delinquent units from already-built matrix rows. Stable order:
 * keeps the matrix row order (block code → unit number, as sorted by getMatrix).
 */
export function computeDelinquentUnits(
  rows: MatrixRowLike[],
  asOfMonth: number,
): DelinquentUnit[] {
  if (asOfMonth < 1) return [];
  const units: DelinquentUnit[] = [];
  for (const row of rows) {
    if (!row.isActive) continue;
    // 0% obligation = no payment duty (house not yet occupied / nobody liable).
    // Their unpaid months are not menunggak — skip them from the collection list.
    if ((row.obligationLabel ?? '').toUpperCase() === '0%') continue;
    const streak = trailingUnpaidStreak(row, asOfMonth);
    if (streak < MIN_STREAK) continue;
    units.push({
      no: row.no,
      unitId: row.unitId,
      blockCode: row.blockCode ?? null,
      blockName: row.blockName ?? null,
      unitNumber: row.unitNumber ?? '',
      unitCode: row.unitCode ?? '',
      residentName: row.residentName ?? null,
      phoneNumber: row.phoneNumber ?? null,
      streakStartMonth: asOfMonth - streak + 1,
      asOfMonth,
      streakCount: streak,
      obligationLabel: row.obligationLabel ?? '-',
      monthlyRate: row.monthlyRate ?? null,
    });
  }
  return units;
}

/** "Mei – Juli 2026" style label for an unpaid range ending at the as-of month. */
export function formatMonthRange(
  startMonth: number,
  asOfMonth: number,
  year: number,
): string {
  const start = MONTH_NAMES_LONG_ID[startMonth - 1];
  const end = MONTH_NAMES_LONG_ID[asOfMonth - 1];
  if (startMonth === asOfMonth) return `${end} ${year}`;
  return `${start} – ${end} ${year}`;
}

/**
 * Month-range label that can span calendar years — for the WhatsApp bot's
 * advance-payment (bayar di muka) flow, where a payment may cover tunggakan
 * plus future months rolling into next year (e.g. "Agustus 2026 – Maret 2027").
 *
 * `formatMonthRange` above is single-year only and is also used by the broadcast
 * blast service, so it is left untouched; this sibling handles the cross-year
 * case and reduces to the same output for same-year/single-month ranges.
 */
export function formatMonthRangeCrossYear(
  start: { month: number; year: number },
  end: { month: number; year: number },
): string {
  const startLabel = `${MONTH_NAMES_LONG_ID[start.month - 1]} ${start.year}`;
  const endLabel = `${MONTH_NAMES_LONG_ID[end.month - 1]} ${end.year}`;
  if (start.year === end.year && start.month === end.month) return endLabel;
  return `${startLabel} – ${endLabel}`;
}

/** "Juli 2026" label for the as-of month; null when as-of month is 0. */
export function formatAsOfLabel(asOfMonth: number, year: number): string | null {
  if (asOfMonth < 1) return null;
  return `${MONTH_NAMES_LONG_ID[asOfMonth - 1]} ${year}`;
}
