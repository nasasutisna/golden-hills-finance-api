import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IplPeriodsService } from '../ipl-periods/ipl-periods.service';
import { CashTransactionsService } from '../cash-transactions/cash-transactions.service';
import { IplPaymentsService } from '../ipl-payments/ipl-payments.service';
import { HouseUnitsService } from '../house-units/house-units.service';
import { CASH_ACCOUNT_IDS } from '../common/constants/cash-accounts';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const toNum = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Aggregated read model for the admin dashboard. Everything the dashboard
 * needs is computed here in a handful of parallel queries so the frontend
 * can render from a single call.
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly iplPeriodsService: IplPeriodsService,
    private readonly cashTransactionsService: CashTransactionsService,
    private readonly iplPaymentsService: IplPaymentsService,
    private readonly houseUnitsService: HouseUnitsService,
  ) {}

  async getOverview() {
    const now = new Date();
    const year = now.getFullYear();

    // Current-month range (YYYY-MM-DD) for per-fund flow.
    const monthStart = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const monthEnd = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [
      houseUnitsTotal,
      houseUnitsActive,
      iplObligatedUnits,
      currentPeriod,
      iplFund,
      wargaFund,
      balances,
    ] = await Promise.all([
      this.prisma.houseUnit.count({ where: { deletedAt: null } }),
      this.prisma.houseUnit.count({ where: { deletedAt: null, isActive: true } }),
      // Active units that actually owe IPL (iplPercentage > 0). Units with 0%
      // have no resident liable (house not yet occupied), so they must NOT be
      // counted toward the IPL target / "belum bayar" figure.
      this.prisma.houseUnit.count({
        where: { deletedAt: null, isActive: true, iplPercentage: { gt: 0 } },
      }),
      this.iplPeriodsService.getCurrentPeriod(),
      this.cashTransactionsService.getIplReport(monthStart, monthEnd),
      this.cashTransactionsService.getKegiatanReport(monthStart, monthEnd),
      this.cashTransactionsService.getAccountBalances(),
    ]);

    // IPL collection status for the current period. The denominator is the
    // obligated-unit count (0% units excluded) so the unpaid figure only counts
    // units that actually have a bill to pay.
    const ipl = await this.computeIplStatus(currentPeriod, iplObligatedUnits);

    // Per-Kas all-time saldo.
    const kasIpl = (balances as any[]).find((b) => b.fundType === 'IPL');
    const kasWarga = (balances as any[]).find((b) => b.fundType === 'WARGA');

    const [monthlyBuckets, recentTransactions, delinquent, occupancy] = await Promise.all([
      this.computeMonthlyChart(year),
      this.computeRecentTransactions(),
      this.computeDelinquent(year),
      this.computeOccupancy(),
    ]);

    return {
      houseUnits: { total: houseUnitsTotal, active: houseUnitsActive },
      ipl,
      iplFund: {
        income: toNum(iplFund?.totalIncome),
        expense: toNum(iplFund?.totalExpense),
        balance: toNum(iplFund?.balance),
      },
      wargaFund: {
        income: toNum(wargaFund?.totalIncome),
        expense: toNum(wargaFund?.totalExpense),
        balance: toNum(wargaFund?.balance),
      },
      balances: {
        ipl: toNum(kasIpl?.balance),
        warga: toNum(kasWarga?.balance),
      },
      // Consolidated (both Kas) — kept for backward compatibility.
      monthlyChart: monthlyBuckets.consolidated,
      // Per-Kas monthly series for the dashboard charts.
      iplMonthlyChart: monthlyBuckets.ipl,
      wargaMonthlyChart: monthlyBuckets.warga,
      delinquent,
      occupancy,
      recentTransactions,
    };
  }

  /**
   * Per-month IPL income/expense for the dashboard chart (year-filterable).
   *
   * Income is sourced from the IPL matrix (`monthTotals` = APPROVED payments
   * summed by period month) so it always matches what the Matrix IPL page
   * shows — using the cash ledger instead would miss payments that were
   * approved but not yet posted, or land them in the month/year of the
   * `paymentDate` rather than the IPL period.
   *
   * Expense is the Kas IPL outflow per month (ledger EXPENSE, transfers
   * excluded) by `transactionDate`.
   */
  async getIplMonthlyChart(year?: number) {
    const y = year && Number.isFinite(year) ? year : new Date().getFullYear();

    const [matrix, buckets] = await Promise.all([
      this.iplPaymentsService.getMatrix({ year: y }),
      this.computeMonthlyChart(y),
    ]);

    const incomeByMonth = (matrix.monthTotals ?? []) as number[];
    const iplExpense = buckets.ipl;

    const series = MONTH_LABELS.map((m, i) => ({
      month: m,
      income: toNum(incomeByMonth[i]),
      expense: toNum(iplExpense[i]?.expense),
    }));

    return { year: y, series };
  }

  /** Distinct-unit counts + total amount for the current IPL period. */
  private async computeIplStatus(currentPeriod: any, totalUnits: number) {
    if (!currentPeriod) {
      return {
        period: null,
        totalUnits,
        paidUnits: 0,
        pendingUnits: 0,
        unpaidUnits: totalUnits,
        totalAmount: 0,
      };
    }

    const periodId = currentPeriod.id;
    const label = `${MONTH_NAMES_FULL[(currentPeriod.month - 1 + 12) % 12] ?? ''} ${currentPeriod.year}`;

    const [paidRows, pendingRows, sum] = await Promise.all([
      this.prisma.iplPayment.findMany({
        where: { periodId, status: 'APPROVED', deletedAt: null },
        select: { houseUnitId: true },
      }),
      this.prisma.iplPayment.findMany({
        where: { periodId, status: 'PENDING', deletedAt: null },
        select: { houseUnitId: true },
      }),
      this.prisma.iplPayment.aggregate({
        where: { periodId, status: 'APPROVED', deletedAt: null },
        _sum: { calculatedAmount: true },
      }),
    ]);

    const paidSet = new Set(paidRows.map((r) => r.houseUnitId).filter(Boolean));
    // Pending units that are not already counted as paid.
    const pendingSet = new Set(
      pendingRows
        .map((r) => r.houseUnitId)
        .filter((id): id is string => Boolean(id) && !paidSet.has(id)),
    );

    const paidUnits = paidSet.size;
    const pendingUnits = pendingSet.size;
    const unpaidUnits = Math.max(0, totalUnits - paidUnits - pendingUnits);

    return {
      period: {
        id: currentPeriod.id,
        periodCode: currentPeriod.periodCode,
        periodName: currentPeriod.periodName,
        month: currentPeriod.month,
        year: currentPeriod.year,
        label,
      },
      totalUnits,
      paidUnits,
      pendingUnits,
      unpaidUnits,
      totalAmount: toNum(sum._sum.calculatedAmount),
    };
  }

  /**
   * Income vs expense per month, partitioned per Kas. One query returns three
   * 12-bucket series: `consolidated` (both Kas), `ipl` (Kas IPL only), and
   * `warga` (Kas Warga only). Transfers are excluded.
   */
  private async computeMonthlyChart(year: number) {
    const yearStart = new Date(year, 0, 1);
    const nextYearStart = new Date(year + 1, 0, 1);

    const rows = await this.prisma.cashTransaction.findMany({
      where: {
        deletedAt: null,
        isInternalTransfer: false,
        cashAccountId: { in: [CASH_ACCOUNT_IDS.KAS_IPL, CASH_ACCOUNT_IDS.KAS_WARGA] },
        transactionDate: { gte: yearStart, lt: nextYearStart },
      },
      select: { transactionType: true, amount: true, transactionDate: true, cashAccountId: true },
    });

    const makeBuckets = () =>
      Array.from({ length: 12 }, (_, i) => ({ month: MONTH_LABELS[i], income: 0, expense: 0 }));

    const consolidated = makeBuckets();
    const ipl = makeBuckets();
    const warga = makeBuckets();

    for (const t of rows) {
      const idx = new Date(t.transactionDate).getMonth();
      if (idx < 0 || idx > 11) continue;
      const isIncome = t.transactionType === 'INCOME';
      if (!isIncome && t.transactionType !== 'EXPENSE') continue;
      const amt = toNum(t.amount);
      const fundBuckets = t.cashAccountId === CASH_ACCOUNT_IDS.KAS_WARGA ? warga : ipl;
      if (isIncome) {
        consolidated[idx].income += amt;
        fundBuckets[idx].income += amt;
      } else {
        consolidated[idx].expense += amt;
        fundBuckets[idx].expense += amt;
      }
    }

    return { consolidated, ipl, warga };
  }

  /** Count of IPL delinquent units (trailing streak of ≥3 UNPAID months). */
  private async computeDelinquent(year: number) {
    try {
      const report = await this.iplPaymentsService.getDelinquentUnits({ year });
      return { count: toNum(report.count), asOfLabel: report.asOfLabel ?? null };
    } catch (err) {
      this.logger.warn(`Failed to compute delinquent units: ${(err as Error)?.message ?? err}`);
      return { count: 0, asOfLabel: null };
    }
  }

  /** House-unit occupancy breakdown (full / half / vacant / buyback counts). */
  private async computeOccupancy() {
    try {
      return await this.houseUnitsService.getOccupancyStats();
    } catch (err) {
      this.logger.warn(`Failed to compute occupancy stats: ${(err as Error)?.message ?? err}`);
      return {
        totalUnits: 0,
        fullyOccupied: 0,
        occasionally: 0,
        vacant: 0,
        rented: 0,
        bankBuyback: 0,
      };
    }
  }

  /** Latest 5 cash transactions (transfers excluded) mapped for display. */
  private async computeRecentTransactions() {
    const rows = await this.prisma.cashTransaction.findMany({
      where: { deletedAt: null, isInternalTransfer: false },
      orderBy: { transactionDate: 'desc' },
      take: 5,
      include: { category: { select: { categoryName: true } } },
    });

    return rows.map((t) => ({
      id: t.id,
      type: t.transactionType === 'INCOME' ? 'INCOME' : 'EXPENSE',
      amount: toNum(t.amount),
      category: t.category?.categoryName ?? '',
      description: t.description ?? '',
      createdAt: t.transactionDate,
      status:
        t.status === 'APPROVED'
          ? 'completed'
          : t.status === 'PENDING'
            ? 'pending'
            : 'failed',
    }));
  }
}
