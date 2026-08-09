import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateSecurityScheduleDto } from './dto/create-security-schedule.dto';
import { UpdateSecurityScheduleDto } from './dto/update-security-schedule.dto';
import { SetDaySecurityScheduleDto } from './dto/set-day-security-schedule.dto';
import { SecuritySchedulesRepository } from './security-schedules.repository';
import { PrismaService } from '../prisma/prisma.service';

/** Fixed shift definitions — Golden Hills policy. */
const SHIFTS = {
  PAGI: { start: '08:00', end: '20:00' },
  MALAM: { start: '20:00', end: '08:00' },
} as const;

/** Guards required per shift slot. */
const PER_SHIFT = 2;
/** Max working days per guard per ISO week → at least 1 day off. */
const WEEKLY_WORK_CAP = 6;

type ShiftKey = keyof typeof SHIFTS;

interface GuardState {
  weekDays: number;
  lastShift: ShiftKey | null;
  pagi: number;
  malam: number;
}

interface GuardLite {
  id: string;
  firstName: string;
  lastName: string | null;
  employeeCode: string;
}

@Injectable()
export class SecuritySchedulesService {
  private readonly logger = new Logger(SecuritySchedulesService.name);

  constructor(
    private readonly securitySchedulesRepository: SecuritySchedulesRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * List schedules. When year+month are given, filter to that month's date range.
   */
  async findAll(queryOptions: QueryOptionsDto, year?: number, month?: number) {
    const { page = 1, limit = 400, sortBy, sortOrder, search, filters } =
      queryOptions;

    const skip = (page - 1) * limit;
    let where: any = {};

    if (year && month) {
      const { from, to } = this.monthRange(year, month);
      where.specificDate = { gte: from, lte: to };
    }

    if (search) {
      where.OR = [
        { employee: { firstName: { contains: search } } },
        { employee: { lastName: { contains: search } } },
        { employee: { employeeCode: { contains: search } } },
      ];
    }

    if (filters) {
      where = { ...where, ...filters };
    }

    // Prisma 7 requires orderBy as an array (single object is rejected).
    const orderBy = sortBy ? [{ [sortBy]: sortOrder }] : undefined;

    const { schedules, total } =
      await this.securitySchedulesRepository.findAll({
        skip,
        take: limit,
        where,
        orderBy,
      });

    const totalPages = Math.ceil(total / limit);

    return {
      data: schedules,
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
    return await this.securitySchedulesRepository.findById(id);
  }

  async create(createSecurityScheduleDto: CreateSecurityScheduleDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: createSecurityScheduleDto.employeeId, deletedAt: null },
      select: { id: true, isActive: true },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    try {
      const data: any = {
        ...createSecurityScheduleDto,
        specificDate: this.parseDate(createSecurityScheduleDto.specificDate),
      };
      const schedule = await this.securitySchedulesRepository.create(data);
      this.logger.log(`Security schedule created: ${schedule.id}`);
      return schedule;
    } catch (error) {
      this.logger.error('Error creating security schedule:', error);
      throw error;
    }
  }

  async update(id: string, updateSecurityScheduleDto: UpdateSecurityScheduleDto) {
    if (updateSecurityScheduleDto.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: updateSecurityScheduleDto.employeeId, deletedAt: null },
        select: { id: true },
      });
      if (!employee) {
        throw new BadRequestException('Employee not found');
      }
    }

    const data: any = { ...updateSecurityScheduleDto };
    if (updateSecurityScheduleDto.specificDate) {
      data.specificDate = this.parseDate(updateSecurityScheduleDto.specificDate);
    }

    try {
      const schedule = await this.securitySchedulesRepository.update(id, data);
      this.logger.log(`Security schedule updated: ${id}`);
      return schedule;
    } catch (error) {
      this.logger.error('Error updating security schedule:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const schedule = await this.securitySchedulesRepository.softDelete(id);
    this.logger.log(`Security schedule soft deleted: ${id}`);
    return schedule;
  }

  async count(where?: any): Promise<number> {
    return await this.securitySchedulesRepository.count(where);
  }

  // ============================================================
  // AUTO-GENERATION
  // ============================================================

  /**
   * Generate a full month of security schedules. When `pairs` (teams of 2) are
   * provided, the month is built by rotating those pairs forward through
   * Pagi → Malam → Libur so rest is spread and a pair never goes Malam → Pagi
   * the next day (per-day for n >= 3, per-week for n = 2). When omitted, falls
   * back to the fair individual rotation. Wipes the month first, then inserts.
   * Returns a summary.
   */
  async generateMonth(year: number, month: number, pairs?: string[][]) {
    const { from, to, dates } = this.monthRange(year, month);

    let entries: Prisma.SecurityScheduleCreateManyInput[];
    let stats: { employeeId: string; name: string; daysWorked: number; pagi: number; malam: number }[];
    let totalGuards: number;
    let uncovered: { date: string; shift: 'PAGI' | 'MALAM' }[];

    if (pairs && pairs.length > 0) {
      ({ entries, stats, totalGuards } = await this.buildPairRotationEntries(
        dates,
        pairs,
      ));
      uncovered = []; // pair rotation always fills both shifts when n >= 2
    } else {
      const result = await this.buildIndividualRotationEntries(dates);
      entries = result.entries;
      stats = result.stats;
      totalGuards = result.totalGuards;
      uncovered = result.uncovered;
    }

    // Wipe the month (incl. any prior manual/soft-deleted entries) and insert.
    const deleted = await this.securitySchedulesRepository.deleteRange(from, to);
    const created =
      entries.length > 0
        ? await this.securitySchedulesRepository.createMany(entries)
        : 0;

    this.logger.log(
      `Generated ${created} security schedule entries for ${year}-${month} ` +
        `(mode=${pairs && pairs.length ? 'pairs' : 'individual'}, guards=${totalGuards}, wiped=${deleted})`,
    );

    return {
      created,
      deleted,
      totalGuards,
      uncovered,
      stats: stats.sort((a, b) => b.daysWorked - a.daysWorked),
    };
  }

  /**
   * Build a month of entries by rotating `pairs` (teams of 2) through the
   * shifts. Rotation slot `s` → Pagi = pairs[s % n], Malam = pairs[(s - 1 + n) % n].
   * The direction is forward (Pagi → Malam → Libur): the pair on Pagi today
   * moves to Malam tomorrow (~24h rest at the boundary), and the day after
   * Malam is always Libur — never Pagi — so there is no back-to-back
   * night-then-morning. Cadence depends on the number of pairs:
   *  • n >= 3 → rotate per DAY. Each day a different pair is off, so each pair's
   *    rest is spread (~every n-th day) instead of clumped into whole off-weeks.
   *    n = 3 ⇒ ~2-3 Libur days/week per pair, never consecutive.
   *  • n  = 2 → no off-days are possible; a daily flip would force Malam→Pagi
   *    every other day, so fall back to a gentler weekly swap (one unavoidable
   *    boundary per two weeks).
   * Validates distinctness (1 guard = 1 pair), exactly 2 per pair, n >= 2, and
   * that every guard is active.
   */
  private async buildPairRotationEntries(
    dates: Date[],
    rawPairs: string[][],
  ): Promise<{
    entries: Prisma.SecurityScheduleCreateManyInput[];
    stats: { employeeId: string; name: string; daysWorked: number; pagi: number; malam: number }[];
    totalGuards: number;
  }> {
    // Normalize + structural validation.
    const pairs: string[][] = rawPairs
      .map((p) => (Array.isArray(p) ? p.filter((id) => typeof id === 'string' && id) : []))
      .filter((p) => p.length > 0);

    if (pairs.length < 2) {
      throw new BadRequestException(
        'Minimal 2 pasangan untuk mengisi shift Pagi dan Malam.',
      );
    }
    for (const p of pairs) {
      if (p.length !== 2 || p[0] === p[1]) {
        throw new BadRequestException(
          'Setiap pasangan harus terdiri dari 2 petugas yang berbeda.',
        );
      }
    }
    // No guard may belong to two different pairs (would double-book on the day
    // their two pairs co-occur as Pagi/Malam).
    const seen = new Set<string>();
    for (const p of pairs) {
      for (const id of p) {
        if (seen.has(id)) {
          throw new BadRequestException(
            'Satu petugas tidak boleh berada di lebih dari satu pasangan.',
          );
        }
        seen.add(id);
      }
    }

    const allIds = [...seen];
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: allIds }, deletedAt: null, isActive: true },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    });
    if (employees.length !== allIds.length) {
      throw new BadRequestException(
        'Terdapat petugas tidak aktif / tidak ditemukan pada pasangan.',
      );
    }
    const empMap = new Map(employees.map((e) => [e.id, e]));

    const n = pairs.length;
    const counters = new Map<string, { pagi: number; malam: number }>();
    allIds.forEach((id) => counters.set(id, { pagi: 0, malam: 0 }));

    // Cadence: per-day for n >= 3 (spreads rest), per-week for n == 2 (avoids
    // a daily Malam→Pagi back-to-back when there are no off-days to buffer).
    const rotatePerDay = n >= 3;
    const firstMonday = rotatePerDay ? null : this.mondayOf(dates[0]);
    const entries: Prisma.SecurityScheduleCreateManyInput[] = [];
    dates.forEach((date, d) => {
      const slot = rotatePerDay ? d : this.weekIndex(date, firstMonday!);
      const pagiPair = pairs[slot % n];
      const malamPair = pairs[(slot - 1 + n) % n];
      for (const id of pagiPair) {
        counters.get(id)!.pagi += 1;
        entries.push({
          employeeId: id,
          specificDate: date,
          shift: 'PAGI',
          startTime: SHIFTS.PAGI.start,
          endTime: SHIFTS.PAGI.end,
          isActive: true,
        });
      }
      for (const id of malamPair) {
        counters.get(id)!.malam += 1;
        entries.push({
          employeeId: id,
          specificDate: date,
          shift: 'MALAM',
          startTime: SHIFTS.MALAM.start,
          endTime: SHIFTS.MALAM.end,
          isActive: true,
        });
      }
    });

    const stats = allIds.map((id) => {
      const c = counters.get(id)!;
      const e = empMap.get(id)!;
      return {
        employeeId: id,
        name: `${e.firstName} ${e.lastName ?? ''}`.trim() || e.employeeCode,
        daysWorked: c.pagi + c.malam,
        pagi: c.pagi,
        malam: c.malam,
      };
    });

    return { entries, stats, totalGuards: allIds.length };
  }

  /**
   * Build a month of entries using the fair individual rotation (the original
   * algorithm). Returns entries + per-guard stats + uncovered slots.
   */
  private async buildIndividualRotationEntries(dates: Date[]): Promise<{
    entries: Prisma.SecurityScheduleCreateManyInput[];
    stats: { employeeId: string; name: string; daysWorked: number; pagi: number; malam: number }[];
    totalGuards: number;
    uncovered: { date: string; shift: 'PAGI' | 'MALAM' }[];
  }> {
    const guards = await this.getSecurityGuards();
    if (guards.length === 0) {
      throw new BadRequestException(
        'Tidak ada employee aktif. Tambahkan data petugas security terlebih dahulu.',
      );
    }

    // Per-guard rolling state across the whole month.
    const state = new Map<string, GuardState>();
    guards.forEach((g) =>
      state.set(g.id, { weekDays: 0, lastShift: null, pagi: 0, malam: 0 }),
    );

    const entries: Prisma.SecurityScheduleCreateManyInput[] = [];
    const uncovered: { date: string; shift: 'PAGI' | 'MALAM' }[] = [];
    let cursor = 0;

    for (const date of dates) {
      // Reset weekly counters every Monday (ISO week boundary).
      if (date.getDay() === 1) {
        guards.forEach((g) => (state.get(g.id)!.weekDays = 0));
      }

      // Eligible pool respecting the weekly day-off cap; relax to 7 if too few.
      let eligible = guards.filter((g) => state.get(g.id)!.weekDays < WEEKLY_WORK_CAP);
      if (eligible.length < PER_SHIFT * 2) {
        eligible = guards.filter((g) => state.get(g.id)!.weekDays < 7);
      }

      // PAGI: pick 2 from the rotated, fairness-ordered pool.
      const pagiPicks = this.pickN(eligible, cursor, PER_SHIFT, 'PAGI', state);
      for (const g of pagiPicks) {
        const s = state.get(g.id)!;
        entries.push({
          employeeId: g.id,
          specificDate: date,
          shift: 'PAGI',
          startTime: SHIFTS.PAGI.start,
          endTime: SHIFTS.PAGI.end,
          isActive: true,
        });
        s.weekDays += 1;
        s.lastShift = 'PAGI';
        s.pagi += 1;
      }

      // MALAM: pick 2 from the remaining eligible.
      const pickedIds = new Set(pagiPicks.map((g) => g.id));
      const remaining = eligible.filter((g) => !pickedIds.has(g.id));
      const malamPicks = this.pickN(remaining, cursor + PER_SHIFT, PER_SHIFT, 'MALAM', state);
      for (const g of malamPicks) {
        const s = state.get(g.id)!;
        entries.push({
          employeeId: g.id,
          specificDate: date,
          shift: 'MALAM',
          startTime: SHIFTS.MALAM.start,
          endTime: SHIFTS.MALAM.end,
          isActive: true,
        });
        s.weekDays += 1;
        s.lastShift = 'MALAM';
        s.malam += 1;
      }

      // Record any unfilled slots (too few guards) for the summary warning.
      const dateStr = this.formatDate(date);
      for (let i = pagiPicks.length; i < PER_SHIFT; i++) {
        uncovered.push({ date: dateStr, shift: 'PAGI' });
      }
      for (let i = malamPicks.length; i < PER_SHIFT; i++) {
        uncovered.push({ date: dateStr, shift: 'MALAM' });
      }

      cursor = (cursor + 1) % guards.length;
    }

    const stats = guards.map((g) => {
      const s = state.get(g.id)!;
      return {
        employeeId: g.id,
        name: `${g.firstName} ${g.lastName ?? ''}`.trim() || g.employeeCode,
        daysWorked: s.pagi + s.malam,
        pagi: s.pagi,
        malam: s.malam,
      };
    });

    return { entries, stats, totalGuards: guards.length, uncovered };
  }

  // ============================================================
  // MANUAL DAY EDITOR (replace a single day's schedule)
  // ============================================================

  /**
   * Replace the entire schedule for one date with the given Pagi/Malam guards.
   * Idempotent: wipes the date first (incl. soft-deleted/prior auto entries),
   * then recreates exactly the requested assignments in a transaction.
   *
   * The DB unique constraint ([employeeId, specificDate]) means a guard may
   * hold at most one shift that day; overlapping ids across shifts are rejected
   * here with a clear message rather than surfacing as a raw P2002.
   */
  async setDay(specificDate: string, dto: SetDaySecurityScheduleDto) {
    const date = this.parseDate(specificDate); // throws on bad format
    const pagi = (dto.pagi ?? []).filter(Boolean);
    const malam = (dto.malam ?? []).filter(Boolean);

    // Cross-shift overlap + within-shift dup (within-shift dup is also caught
    // by the DTO, but we double-check defensively).
    const overlap = pagi.filter((id) => malam.includes(id));
    if (overlap.length > 0) {
      throw new BadRequestException(
        'Satu petugas tidak bisa mengisi shift Pagi dan Malam di hari yang sama',
      );
    }

    const allIds = [...pagi, ...malam];
    if (allIds.length > 0) {
      const employees = await this.prisma.employee.findMany({
        where: { id: { in: allIds }, deletedAt: null, isActive: true },
        select: { id: true },
      });
      const validIds = new Set(employees.map((e) => e.id));
      const invalid = allIds.filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException(
          'Terdapat petugas tidak aktif / tidak ditemukan',
        );
      }
    }

    const entries: Prisma.SecurityScheduleCreateManyInput[] = [];
    for (const employeeId of pagi) {
      entries.push({
        employeeId,
        specificDate: date,
        shift: 'PAGI',
        startTime: SHIFTS.PAGI.start,
        endTime: SHIFTS.PAGI.end,
        isActive: true,
      });
    }
    for (const employeeId of malam) {
      entries.push({
        employeeId,
        specificDate: date,
        shift: 'MALAM',
        startTime: SHIFTS.MALAM.start,
        endTime: SHIFTS.MALAM.end,
        isActive: true,
      });
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.securitySchedule.deleteMany({ where: { specificDate: date } });
      if (entries.length === 0) return 0;
      const result = await tx.securitySchedule.createMany({ data: entries });
      return result.count;
    });

    this.logger.log(
      `setDay ${specificDate}: created=${created}, pagi=${pagi.length}, malam=${malam.length}`,
    );

    return { date: specificDate, created };
  }

  /**
   * Pick `n` guards from `pool`, starting the rotation at `startCursor`, ordered
   * to favour alternation (last shift != target) and balance the shift counts.
   */
  private pickN(
    pool: GuardLite[],
    startCursor: number,
    n: number,
    targetShift: ShiftKey,
    state: Map<string, GuardState>,
  ): GuardLite[] {
    if (pool.length === 0 || n <= 0) return [];

    // Rotate the pool by the cursor so the same guard isn't always first.
    const rotated: GuardLite[] = [];
    const len = pool.length;
    for (let i = 0; i < len; i++) {
      rotated.push(pool[(startCursor + i) % len]);
    }

    rotated.sort((a, b) => {
      const sa = state.get(a.id)!;
      const sb = state.get(b.id)!;
      // 1) Prefer guards whose last shift was NOT the target (alternation).
      const aPref = sa.lastShift === targetShift ? 1 : 0;
      const bPref = sb.lastShift === targetShift ? 1 : 0;
      if (aPref !== bPref) return aPref - bPref;
      // 2) Prefer guards with fewer of the target shift so far (balance).
      const aCount = targetShift === 'PAGI' ? sa.pagi : sa.malam;
      const bCount = targetShift === 'PAGI' ? sb.pagi : sb.malam;
      if (aCount !== bCount) return aCount - bCount;
      // 3) Prefer guards who've worked fewer days this week.
      return sa.weekDays - sb.weekDays;
    });

    return rotated.slice(0, Math.min(n, rotated.length));
  }

  /**
   * Active employees eligible to be security guards. Prefer those whose position
   * mentions security/keamanan/satpam; fall back to all active employees.
   */
  private async getSecurityGuards(): Promise<GuardLite[]> {
    const all = await this.prisma.employee.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        position: { select: { positionName: true, department: true } },
      },
      orderBy: { firstName: 'asc' },
    });

    const isSecurity = (e: any) => {
      const hay = `${e.position?.positionName ?? ''} ${e.position?.department ?? ''}`.toLowerCase();
      return (
        hay.includes('security') ||
        hay.includes('keamanan') ||
        hay.includes('satpam')
      );
    };

    const pool = all.filter(isSecurity);
    const finalPool = pool.length > 0 ? pool : all;
    // Stable ordering by id so the cursor rotation is deterministic.
    return finalPool
      .map((e: any) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        employeeCode: e.employeeCode,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  /** First day, last day, and the full list of dates (local noon) for a month. */
  private monthRange(year: number, month: number): {
    from: Date;
    to: Date;
    dates: Date[];
  } {
    const lastDay = new Date(year, month, 0).getDate();
    const dates: Date[] = [];
    for (let d = 1; d <= lastDay; d++) {
      // Local noon avoids midnight timezone shifts on the @db.Date column.
      dates.push(new Date(year, month - 1, d, 12, 0, 0));
    }
    return {
      from: new Date(year, month - 1, 1, 12, 0, 0),
      to: new Date(year, month - 1, lastDay, 12, 0, 0),
      dates,
    };
  }

  /** Parse a YYYY-MM-DD string to a local-noon Date (tz-safe for @db.Date). */
  private parseDate(value: string): Date {
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) {
      throw new BadRequestException('specificDate must be YYYY-MM-DD');
    }
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  /** Format a Date to YYYY-MM-DD (local components, tz-safe). */
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Monday (local noon, tz-safe) of the ISO week containing `date`. */
  private mondayOf(date: Date): Date {
    const d = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0,
    );
    const day = d.getDay(); // 0 = Sun … 6 = Sat
    const diff = day === 0 ? -6 : 1 - day; // shift back/forward to Monday
    d.setDate(d.getDate() + diff);
    return d;
  }

  /** Zero-based index of `date`'s ISO week relative to `firstMonday`. */
  private weekIndex(date: Date, firstMonday: Date): number {
    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
    const d = this.mondayOf(date);
    return Math.round((d.getTime() - firstMonday.getTime()) / MS_PER_WEEK);
  }
}
