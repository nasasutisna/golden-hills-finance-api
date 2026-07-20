import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IplPeriodsService } from '../ipl-periods/ipl-periods.service';
import { CashTransactionsService } from '../cash-transactions/cash-transactions.service';
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
  ) {}

  async getOverview() {
    const now = new Date();
    const year = now.getFullYear();

    // Current-month range (YYYY-MM-DD) for per-fund flow.
    const monthStart = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const monthEnd = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [houseUnitsTotal, houseUnitsActive, currentPeriod, iplFund, wargaFund, balances] =
      await Promise.all([
        this.prisma.houseUnit.count({ where: { deletedAt: null } }),
        this.prisma.houseUnit.count({ where: { deletedAt: null, isActive: true } }),
        this.iplPeriodsService.getCurrentPeriod(),
        this.cashTransactionsService.getIplReport(monthStart, monthEnd),
        this.cashTransactionsService.getKegiatanReport(monthStart, monthEnd),
        this.cashTransactionsService.getAccountBalances(),
      ]);

    // IPL collection status for the current period.
    const ipl = await this.computeIplStatus(currentPeriod, houseUnitsActive);

    // Per-Kas all-time saldo.
    const kasIpl = (balances as any[]).find((b) => b.fundType === 'IPL');
    const kasWarga = (balances as any[]).find((b) => b.fundType === 'WARGA');

    const [monthlyChart, recentTransactions] = await Promise.all([
      this.computeMonthlyChart(year),
      this.computeRecentTransactions(),
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
      monthlyChart,
      recentTransactions,
    };
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

  /** Consolidated (both Kas, transfers excluded) income vs expense per month. */
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
      select: { transactionType: true, amount: true, transactionDate: true },
    });

    const buckets = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_LABELS[i],
      income: 0,
      expense: 0,
    }));

    for (const t of rows) {
      const idx = new Date(t.transactionDate).getMonth();
      if (idx < 0 || idx > 11) continue;
      if (t.transactionType === 'INCOME') buckets[idx].income += toNum(t.amount);
      else if (t.transactionType === 'EXPENSE') buckets[idx].expense += toNum(t.amount);
    }

    return buckets;
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
