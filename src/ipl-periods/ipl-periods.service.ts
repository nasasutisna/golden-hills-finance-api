import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { QueryIplPeriodsDto } from './dto/query-ipl-periods.dto';
import { CreateIplPeriodDto } from './dto/create-ipl-period.dto';
import { UpdateIplPeriodDto } from './dto/update-ipl-period.dto';
import { GenerateIplPeriodsDto } from './dto/generate-ipl-periods.dto';
import { IplPeriodsRepository } from './ipl-periods.repository';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { IplPeriodStatus } from './dto/create-ipl-period.dto';

// Indonesian month metadata — must mirror the frontend form
// (src/.../ipl-period-form/ipl-period-form.page.ts) so generated periods
// share the exact same periodCode / periodName format as manual ones.
const MONTH_ABBREVIATIONS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

@Injectable()
export class IplPeriodsService {
  private readonly logger = new Logger(IplPeriodsService.name);

  constructor(
    private readonly iplPeriodsRepository: IplPeriodsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(queryOptions: QueryIplPeriodsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, month, year } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search) {
      where.OR = [
        { periodCode: { contains: search } },
        { periodName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (month) {
      where.month = month;
    }

    if (year) {
      where.year = year;
    }

    const { periods, total } = await this.iplPeriodsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: periods,
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
    return await this.iplPeriodsRepository.findById(id);
  }

  async findByPeriodCode(periodCode: string) {
    return await this.iplPeriodsRepository.findByPeriodCode(periodCode);
  }

  async getCurrentPeriod() {
    return await this.iplPeriodsRepository.getCurrentPeriod();
  }

  async getActivePeriods() {
    return await this.iplPeriodsRepository.getActivePeriods();
  }

  async create(createIplPeriodDto: CreateIplPeriodDto) {
    // Check if period code already exists
    const existingPeriod = await this.iplPeriodsRepository.findByPeriodCode(
      createIplPeriodDto.periodCode,
    );
    if (existingPeriod) {
      throw new ConflictException('Period code already exists');
    }

    // Check if period for the same month/year already exists
    const existingMonthYear = await this.iplPeriodsRepository.findByMonthYear(
      createIplPeriodDto.month,
      createIplPeriodDto.year,
    );
    if (existingMonthYear) {
      throw new ConflictException(`Period for ${createIplPeriodDto.month}/${createIplPeriodDto.year} already exists`);
    }

    try {
      const period = await this.iplPeriodsRepository.create(createIplPeriodDto);
      this.logger.log(`IPL period created: ${period.periodCode}`);
      return period;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating IPL period:', error);
      throw error;
    }
  }

  /**
   * Generate all 12 monthly periods (Jan-Dec) for a given year in one shot.
   * - Idempotent: months that already exist (by month/year or periodCode) are skipped.
   * - Atomic: all inserts run inside a single transaction so a partial year is never persisted.
   * - dueDate (optional) is derived per month from a single `dueDay` and clipped to month length.
   */
  async generateYear(dto: GenerateIplPeriodsDto) {
    const { year } = dto;
    const baseRate = dto.baseRate ?? 2500;
    const status = dto.status ?? IplPeriodStatus.ACTIVE;

    const result = await this.prisma.executeInTransaction(async (tx) => {
      const createdPeriods: any[] = [];
      const skippedMonths: number[] = [];

      for (let month = 1; month <= 12; month++) {
        const periodCode = `${MONTH_ABBREVIATIONS[month - 1]}-${year}`;
        const periodName = `${MONTH_NAMES[month - 1]} ${year}`;
        const dueDate = dto.dueDay ? this.computeDueDate(year, month, dto.dueDay) : null;

        // Skip if this month/year or this periodCode already exists (treat soft-deleted as free for month/year,
        // but periodCode @unique is global so we still check it to avoid a unique-violation).
        const existing = await tx.iplPeriod.findFirst({
          where: {
            OR: [
              { periodCode },
              { month, year, deletedAt: null },
            ],
          },
          select: { id: true },
        });

        if (existing) {
          skippedMonths.push(month);
          continue;
        }

        const created = await tx.iplPeriod.create({
          data: {
            periodCode,
            periodName,
            month,
            year,
            baseRate,
            status,
            dueDate,
          },
        });
        createdPeriods.push(created);
      }

      return { createdPeriods, skippedMonths };
    });

    this.logger.log(
      `Generated IPL periods for ${year}: ${result.createdPeriods.length} created, ${result.skippedMonths.length} skipped`,
    );

    return {
      created: result.createdPeriods.length,
      skipped: result.skippedMonths.length,
      skippedMonths: result.skippedMonths,
      periods: result.createdPeriods,
    };
  }

  /**
   * Idempotently ensure an ACTIVE IplPeriod exists for {month, year}, creating
   * it on demand. Used by the WhatsApp bot's advance-payment (bayar di muka)
   * flow: a resident may pay into a future month/year whose period doesn't exist
   * yet, so it is created at proof-upload time with the rate locked to the
   * current baseRate. Surgical — only the requested month is touched, not the
   * whole year (unlike generateYear).
   *
   *  - Existing & ACTIVE → returned as-is (reuse; the common case once scaffolded).
   *  - Existing & not ACTIVE → BadRequestException (reactivating a CLOSED period
   *    is an admin decision, not a side effect of a resident paying).
   *  - Missing → created ACTIVE with `baseRate`, dueDate null (no due date for a
   *    pre-paid month). periodCode/periodName follow the generateYear convention
   *    so manual + bot-created periods are indistinguishable.
   *  - Concurrent insert / soft-deleted-code collision (Prisma P2002 on the
   *    globally-unique periodCode) → re-read to recover; if the colliding row is
   *    itself soft-deleted, surface a clear error (cannot reuse without restore).
   */
  async ensurePeriod(
    month: number,
    year: number,
    baseRate: number,
    tx?: PrismaTransactionalClient,
  ): Promise<{ id: string; periodCode: string; status: string }> {
    // Run on the caller's transaction when provided (e.g. inside IplPaymentsService.create),
    // otherwise on the shared client (e.g. the WhatsApp bot's standalone advance-pay path).
    const db = tx ?? this.prisma;

    const existing = await db.iplPeriod.findFirst({
      where: { month, year, deletedAt: null },
      select: { id: true, periodCode: true, status: true },
    });
    if (existing) {
      if (existing.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Periode ${existing.periodCode} berstatus ${existing.status}, tidak dapat dibayar. Hubungi admin.`,
        );
      }
      return existing;
    }

    const periodCode = `${MONTH_ABBREVIATIONS[month - 1]}-${year}`;
    const periodName = `${MONTH_NAMES[month - 1]} ${year}`;
    try {
      const created = await db.iplPeriod.create({
        data: {
          periodCode,
          periodName,
          month,
          year,
          baseRate,
          status: 'ACTIVE',
          dueDate: null,
        },
        select: { id: true, periodCode: true, status: true },
      });
      this.logger.log(`IPL period auto-created (on demand): ${periodCode}`);
      return created;
    } catch (error: any) {
      // P2002 = unique violation on the globally-unique periodCode (a concurrent
      // insert, or a soft-deleted row still holding the code). Re-read to recover.
      if (error?.code === 'P2002') {
        const collided = await db.iplPeriod.findFirst({
          where: { periodCode },
          select: { id: true, periodCode: true, status: true, deletedAt: true },
        });
        if (collided?.deletedAt) {
          throw new BadRequestException(
            `Periode ${periodCode} telah dihapus sebelumnya; minta admin untuk memulihkannya.`,
          );
        }
        if (collided && collided.status === 'ACTIVE') return collided;
        throw new BadRequestException(
          `Periode ${periodCode} berstatus ${collided?.status ?? '?'}, tidak dapat dibayar. Hubungi admin.`,
        );
      }
      throw error;
    }
  }

  /**
   * Guarantee an ACTIVE IplPeriod exists for a specific {month, year}, creating
   * it on demand. Used by the IPL payment matrix: when an admin clicks a month
   * cell whose period hasn't been generated yet, the period is auto-created so a
   * payment can be recorded instead of blocking with "belum tersedia". Reuses
   * {@link ensurePeriod} (idempotent) and locks the rate via
   * {@link resolveCurrentBaseRate}. Returns the full period record plus a
   * `created` flag so callers can tell create-vs-existing apart.
   */
  async ensurePeriodForMonth(
    month: number,
    year: number,
  ): Promise<{ period: any; created: boolean }> {
    const baseRate = await this.resolveCurrentBaseRate(2500);

    const existing = await this.prisma.iplPeriod.findFirst({
      where: { month, year, deletedAt: null },
      select: { id: true },
    });

    const ensured = await this.ensurePeriod(month, year, baseRate);
    const period = await this.iplPeriodsRepository.findById(ensured.id);
    return { period, created: !existing };
  }

  /**
   * Convenience wrapper around {@link ensurePeriodForMonth} for the current
   * month/year. Powers POST /ipl-periods/ensure-current.
   */
  async ensureCurrentPeriod(): Promise<{ period: any; created: boolean }> {
    const now = new Date();
    return this.ensurePeriodForMonth(now.getMonth() + 1, now.getFullYear());
  }

  /**
   * The baseRate to lock into any auto-created future period: the earliest ACTIVE
   * period's rate (matches how getMatrix estimates the monthly rate, and is
   * stable/admin-set). Falls back to `fallbackDerived` (per-sqm rate derived from
   * the unit's landArea/iplPercentage) only when no ACTIVE period exists at all.
   */
  async resolveCurrentBaseRate(fallbackDerived: number): Promise<number> {
    const earliest = await this.prisma.iplPeriod.findFirst({
      where: { status: 'ACTIVE', deletedAt: null },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      select: { baseRate: true },
    });
    if (earliest) {
      const rate = Number(earliest.baseRate);
      if (Number.isFinite(rate) && rate > 0) return rate;
    }
    return Number.isFinite(fallbackDerived) && fallbackDerived > 0
      ? fallbackDerived
      : 2500;
  }

  /**
   * Compute the due date for a given year/month using a fixed day-of-month.
   * Clips `dueDay` to the last valid day of the month (e.g. 31 in Feb -> 28/29).
   * Returns an ISO string at 00:00:00 UTC.
   */
  private computeDueDate(year: number, month: number, dueDay: number): string {
    // day=0 of the next month yields the last day of the current month
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const day = Math.min(dueDay, lastDay);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString();
  }

  async update(id: string, updateIplPeriodDto: UpdateIplPeriodDto) {
    try {
      const period = await this.iplPeriodsRepository.update(id, updateIplPeriodDto);
      this.logger.log(`IPL period updated: ${period.periodCode}`);
      return period;
    } catch (error) {
      this.logger.error('Error updating IPL period:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const period = await this.iplPeriodsRepository.softDelete(id);
    this.logger.log(`IPL period soft deleted: ${period.periodCode}`);
    return period;
  }

  async restore(id: string) {
    const period = await this.iplPeriodsRepository.restore(id);
    this.logger.log(`IPL period restored: ${period.periodCode}`);
    return period;
  }

  async count(where?: any): Promise<number> {
    return await this.iplPeriodsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.iplPeriodsRepository.exists(id);
  }

  async findWithStats(queryOptions: QueryIplPeriodsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, month, year } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search) {
      where.OR = [
        { periodCode: { contains: search } },
        { periodName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (month) {
      where.month = month;
    }

    if (year) {
      where.year = year;
    }

    const { periods, total } = await this.iplPeriodsRepository.findWithStats({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: periods,
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
}
