import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DelinquentReport,
  DelinquentUnit,
  formatMonthRange,
  formatMonthRangeCrossYear,
} from '../../ipl-payments/helpers/delinquent-units.helper';
import { IplPaymentsService } from '../../ipl-payments/ipl-payments.service';
import { IplReceiptsService } from '../../ipl-payments/ipl-receipts.service';
import { IplPeriodsService } from '../../ipl-periods/ipl-periods.service';
import { ResidentPaymentsService } from '../../resident-payments/resident-payments.service';
import { ResidentPaymentReceiptsService } from '../../resident-payments/resident-payment-receipts.service';
import { WhatsappClientService } from '../whatsapp-client.service';
import { normalizeToWaJid } from '../helpers/phone.helper';
import {
  buildAdminHandoffText,
  buildAskPayUnitText,
  buildAskUnitCodeText,
  buildIplOutstandingText,
  buildIuranOutstandingText,
  buildIuranPayApprovedText,
  buildIuranPayProofPromptText,
  buildIuranPaySummaryText,
  buildMediaAckText,
  buildMenuText,
  buildNoIuranOutstandingText,
  buildNoOutstandingText,
  buildPayApprovedText,
  buildPayCannotAttributeText,
  buildPayDuplicateText,
  buildPayFailedText,
  buildPayMonthChoiceInvalidText,
  buildPayNoUnitText,
  buildPayProofAwaitingText,
  buildPayProofPromptText,
  buildPayProofUnsupportedText,
  buildPayReceivedText,
  buildPayRejectedText,
  buildPaySummaryText,
  buildPayUnregisteredText,
  buildPayUnitNotFoundText,
  buildPayUnitOutsideBlockText,
  buildTemporarilyUnavailableText,
  buildUnitNotFoundText,
  buildUnknownChoiceText,
} from './bot-messages.helper';
import {
  computeFutureMonthSlots,
  extractText,
  findUnitByCode,
  hasMedia,
  isMenuKeyword,
  isMonthCountOverCap,
  isPersonalChat,
  isProofMimeType,
  jidToDigits,
  MAX_ADVANCE_MONTHS,
  matchResidentByPhone,
  parseMonthCount,
  ResidentLite,
  unitBelongsToBlocks,
  UnitLite,
} from './resident-resolver.helper';

type BotStep =
  | 'IDLE'
  | 'AWAITING_CHOICE'
  | 'AWAITING_UNIT_CODE'
  | 'AWAITING_PAY_UNIT'
  | 'AWAITING_PAY_MONTHS'
  | 'AWAITING_PAY_PROOF';

/** Which "Cek" flow owns the typed-house-code fallback (AWAITING_UNIT_CODE). */
type CekKind = 'IPL' | 'IURAN';

/** Which fee a pay flow is for — branches the shared handlers at a few points. */
type PayKind = 'IPL' | 'IURAN';

/** A single unpaid, payable month resolved from the matrix. */
interface PayableMonth {
  month: number;
  year: number;
  /**
   * IPL period id (always set for IPL). Iuran Warga has no period table, so it
   * is `null` there — the `!!periodId` filter in `beginPayForUnit` must be
   * skipped for IURAN, or every iuran month gets dropped.
   */
  periodId: string | null;
}

/** In-progress "Bayar IPL/Iuran" context, carried on the session across steps. */
interface PayContext {
  kind: PayKind;
  isCoordinator: boolean;
  /** Coordinator's block ids — typed unit codes are validated against these. */
  blockIds: string[];
  /** User id recorded as `submittedBy`/`createdBy` (resident's own, or system bot user). */
  submittedByUserId: string | null;
  // Filled once the target unit + payer are resolved:
  residentId?: string;
  houseUnitId?: string;
  unitNumber?: string;
  monthlyRate?: number;
  payableMonths?: PayableMonth[];
  /**
   * Unit land area + IPL percentage — only used to derive the per-sqm baseRate
   * fallback when auto-creating a future IPL period and NO active period exists
   * anywhere (essentially never; resolveCurrentBaseRate prefers a real period).
   */
  landArea?: number;
  iplPercentage?: number;
}

interface BotSession {
  step: BotStep;
  lastActivity: number;
  pay?: PayContext;
  /** Set when a Cek flow falls back to asking a house code; routes handleUnitCode. */
  cekKind?: CekKind;
}

/**
 * Incoming-message customer-service bot.
 *
 * Registered with `WhatsappClientService` on init (only when
 * `whatsapp.bot.enabled` is true). Owns a per-JID conversation state machine
 * covering: Cek IPL, Bayar IPL (resident self-pay + coordinator pay-for-block,
 * with bukti-transfer upload), and Bicara Admin. Reuses
 * `IplPaymentsService` as the single source of truth for amounts, periods and
 * payment creation; listens to its approve/reject events to push the result
 * (and the KWT receipt) back to the resident.
 *
 * All real work is delegated to pure helpers so this class stays a thin
 * orchestrator: resolve identity → look up data → reply.
 */
@Injectable()
export class WhatsappBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappBotService.name);

  private botDisabled = true;
  private sessionTtlMs = 10 * 60_000;
  private residentCacheTtlMs = 5 * 60_000;
  /** When true, every incoming message event is logged (debug aid). */
  private trace = false;
  /** Delinquency report is cached for this long (the matrix is read-only-ish). */
  private static readonly DELINQUENT_CACHE_TTL_MS = 60_000;

  /** Per-JID conversation state. */
  private readonly sessions = new Map<string, BotSession>();
  /** Prevents overlapping handling of rapid messages from the same JID. */
  private readonly inFlight = new Set<string>();
  private sweepTimer: NodeJS.Timeout | null = null;
  /** Last inbound personal message — surfaced by the status endpoint. */
  private lastIncoming: { jid: string; at: number; preview: string } | null =
    null;

  /** Resident cache (phone → identity) for the auto-identify path. */
  private residentsCache: { at: number | null; list: ResidentLite[] } = {
    at: null,
    list: [],
  };
  /** House-unit cache for the typed-code fallback path. */
  private unitsCache: { at: number | null; list: UnitLite[] } = {
    at: null,
    list: [],
  };
  /** Cached delinquency report for the current year. */
  private delinquentCache: {
    year: number | null;
    at: number | null;
    report: DelinquentReport | null;
  } = { year: null, at: null, report: null };
  /**
   * LID → resident map for identifying `@lid` senders. Built by resolving every
   * resident's phone to its LID (one batched usync). Refreshed on a long TTL
   * because LID↔phone is stable and the lookup is server-backed on first build.
   */
  private lidResidentCache: {
    at: number | null;
    byLidUser: Map<string, ResidentLite>;
  } = { at: null, byLidUser: new Map() };
  private static readonly LID_MAP_TTL_MS = 30 * 60_000;

  /**
   * Resolved system-user id for `submittedBy` on WA payments. `undefined` =
   * not yet resolved, `null` = resolved but not configured (self-pay residents
   * without an app account then can't be attributed — surfaced gracefully).
   */
  private systemUserIdCache: string | null | undefined = undefined;

  constructor(
    private readonly client: WhatsappClientService,
    private readonly iplPayments: IplPaymentsService,
    private readonly iplReceipts: IplReceiptsService,
    private readonly iplPeriods: IplPeriodsService,
    private readonly residentPayments: ResidentPaymentsService,
    private readonly residentPaymentReceipts: ResidentPaymentReceiptsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) { }

  onModuleInit(): void {
    const enabled = this.config.get<boolean>('whatsapp.bot.enabled') ?? false;
    this.sessionTtlMs =
      this.config.get<number>('whatsapp.bot.sessionTtlMs') ?? this.sessionTtlMs;
    this.residentCacheTtlMs =
      this.config.get<number>('whatsapp.bot.residentCacheTtlMs') ??
      this.residentCacheTtlMs;
    this.trace = this.config.get<boolean>('whatsapp.bot.trace') ?? false;

    if (!enabled) {
      this.botDisabled = true;
      this.logger.log('WhatsApp CS bot disabled (WHATSAPP_BOT_ENABLED != true).');
      return;
    }

    this.botDisabled = false;
    this.client.registerMessageHandler((payload) => this.onUpsert(payload));
    this.startSweep();
    this.logger.log('WhatsApp CS bot enabled — listening for incoming messages.');
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  /**
   * Health/observability snapshot for the `GET /whatsapp-blast/bot/status`
   * endpoint. Answers the three "why isn't the bot replying?" questions at
   * once: is it enabled, is the socket paired, and did a message even arrive.
   */
  async getBotStatus(): Promise<{
    enabled: boolean;
    socketConnected: boolean;
    phoneNumber: string | null;
    connectionState: string;
    activeSessions: number;
    lastIncoming: { jid: string; at: number; preview: string } | null;
  }> {
    const status = await this.client.getStatus();
    return {
      enabled: !this.botDisabled,
      socketConnected: status.connected,
      phoneNumber: status.phoneNumber,
      connectionState: status.state,
      activeSessions: this.sessions.size,
      lastIncoming: this.lastIncoming,
    };
  }

  // ------------------------------------------------------------------
  // Incoming-message entry point
  // ------------------------------------------------------------------

  /**
   * Hooked into Baileys' `messages.upsert` by the client service. Guards hard
   * before dispatching: only brand-new personal messages (not groups, not ours,
   * not stale backlog) reach the state machine.
   */
  private async onUpsert(payload: {
    messages: any[];
    type: string;
  }): Promise<void> {
    // Disabled bots stay silent (the status endpoint reports the state); we
    // don't want to log on every message when the bot is intentionally off.
    if (this.botDisabled) return;

    // Verbose trace of EVERY incoming event — placed before any guard so even
    // group / fromMe / history-sync messages show up. The jid suffix tells
    // personal (@s.whatsapp.net or @lid) vs group (@g.us); fromMe flags messages
    // sent by the paired number itself (which the bot must never answer).
    const head = payload?.messages?.[0];
    if (this.trace) {
      this.logger.log(
        `[wa-bot-trace] upsert type=${payload?.type} ` +
        `jid=${head?.key?.remoteJid ?? '(none)'} ` +
        `fromMe=${head?.key?.fromMe} hasMessage=${!!head?.message}`,
      );
    }

    if (payload?.type !== 'notify') return;

    const msg = payload.messages?.[0];
    if (!msg?.message) return;

    const jid: string = msg.key?.remoteJid ?? '';
    // Only personal chats — never reply in groups/broadcast (bot noise).
    // Accepts both classic `@s.whatsapp.net` and modern `@lid` (Linked Identity)
    // personal JIDs; see isPersonalChat().
    if (!isPersonalChat(jid)) return;
    // Anti-loop: never answer our own outgoing messages.
    if (msg.key?.fromMe) return;

    // From here it's a genuine personal inbound message. Trace it so a silent
    // bot is diagnosable: each remaining guard now says *why* it dropped it.
    if (!this.client.isConnected()) {
      this.logger.warn(
        `Pesan masuk dari ${jid} diabaikan — socket WhatsApp belum terhubung. ` +
        `Pair dulu: GET /whatsapp-blast/status lalu POST /whatsapp-blast/connect.`,
      );
      return;
    }
    if (this.isStale(msg)) {
      this.logger.debug(`Pesan dari ${jid} diabaikan (stale/backlog).`);
      return;
    }

    const text = extractText(msg).trim();
    const media = hasMedia(msg);
    this.lastIncoming = {
      jid,
      at: Date.now(),
      preview: text.slice(0, 60) || (media ? '[media]' : '[kosong]'),
    };

    if (this.inFlight.has(jid)) {
      this.logger.debug(
        `Pesan dari ${jid} diabaikan (sedang diproses/duplikat).`,
      );
      return;
    }
    this.inFlight.add(jid);

    const currentStep = this.sessions.get(jid)?.step ?? 'IDLE';
    this.logger.log(
      `Pesan masuk dari ${jid}: "${this.lastIncoming.preview}" (media=${media}, sesi=${currentStep}).`,
    );

    try {
      await this.dispatch(jid, msg);
    } catch (err: any) {
      this.logger.error(`Bot error untuk ${jid}: ${err?.message ?? err}`);
    } finally {
      this.inFlight.delete(jid);
    }
  }

  /** Skip messages older than 2 minutes (avoids replying to backlog on reconnect). */
  private isStale(msg: any): boolean {
    const ts = msg?.messageTimestamp;
    if (typeof ts !== 'number') return false;
    return Date.now() / 1000 - ts > 120;
  }

  // ------------------------------------------------------------------
  // State machine
  // ------------------------------------------------------------------

  private async dispatch(jid: string, msg: any): Promise<void> {
    const text = extractText(msg).trim();
    const media = hasMedia(msg);
    const session = this.getOrCreateSession(jid);

    // Escape hatch — a menu keyword always returns to the main menu, cancelling
    // any in-flight flow. (In AWAITING_CHOICE it just re-shows the same menu.)
    if (isMenuKeyword(text)) {
      await this.showMenu(jid, session);
      return;
    }

    // Proof upload step takes priority: media here is the bukti transfer, and a
    // plain-text reply just re-prompts for it.
    if (session.step === 'AWAITING_PAY_PROOF') {
      await this.handlePayProof(jid, msg, session);
      return;
    }

    // Any other inbound media (no flow is expecting it) → generic acknowledgement.
    if (media) {
      await this.reply(jid, buildMediaAckText());
      this.endFlow(session);
      return;
    }

    if (session.step === 'IDLE') {
      await this.showMenu(jid, session);
      return;
    }

    if (session.step === 'AWAITING_CHOICE') {
      await this.handleChoice(jid, text, session);
      return;
    }

    if (session.step === 'AWAITING_UNIT_CODE') {
      await this.handleUnitCode(jid, text, session);
      return;
    }

    if (session.step === 'AWAITING_PAY_UNIT') {
      await this.handlePayUnit(jid, text, session);
      return;
    }

    if (session.step === 'AWAITING_PAY_MONTHS') {
      await this.handlePayMonths(jid, text, session);
      return;
    }
  }

  private async showMenu(jid: string, session: BotSession): Promise<void> {
    await this.reply(jid, buildMenuText());
    session.step = 'AWAITING_CHOICE';
    delete session.pay;
    delete session.cekKind;
    this.touch(session);
  }

  private async handleChoice(
    jid: string,
    text: string,
    session: BotSession,
  ): Promise<void> {
    const t = text.toLowerCase();
    if (t === '1' || t === '01' || t.includes('ipl') || t.includes('tagihan')) {
      await this.runIplFlow(jid, session);
      return;
    }
    // Iuran Warga — checked before the generic "bayar" branch so "bayar iuran"
    // routes here (not to Bayar IPL). "iuran" never contains "ipl", so the IPL
    // check above doesn't collide.
    if (t === '3' || t === '03' || t === '4' || t === '04' || t.includes('iuran')) {
      const wantPay =
        t === '4' || t === '04' || t.includes('bayar') || t.includes('transfer');
      if (wantPay) {
        await this.runPayIuranFlow(jid, session);
      } else {
        await this.runIuranFlow(jid, session);
      }
      return;
    }
    if (t === '2' || t === '02' || t.includes('bayar')) {
      await this.runPayIplFlow(jid, session);
      return;
    }
    if (t === '0' || t === '00' || t.includes('admin')) {
      await this.reply(jid, buildAdminHandoffText());
      this.endFlow(session);
      return;
    }
    if (t === 'menu' || t === 'batal' || t === 'kembali') {
      await this.showMenu(jid, session);
      return;
    }
    await this.reply(jid, buildUnknownChoiceText());
    this.touch(session);
  }

  private async handleUnitCode(
    jid: string,
    text: string,
    session: BotSession,
  ): Promise<void> {
    const unit = findUnitByCode(await this.getUnits(), text);
    if (!unit) {
      await this.reply(jid, buildUnitNotFoundText());
      this.touch(session); // stay in this step; resident can retry or type "menu"
      return;
    }
    if (session.cekKind === 'IURAN') {
      await this.sendIuranForUnit(jid, unit.id);
    } else {
      await this.sendIplForUnit(jid, unit.id);
    }
    this.endFlow(session);
  }

  // ------------------------------------------------------------------
  // Flow 1 — Cek IPL
  // ------------------------------------------------------------------

  /** Option 1: identify the resident, then surface their IPL delinquency. */
  private async runIplFlow(jid: string, session: BotSession): Promise<void> {
    const resident = await this.identifyResident(jid);

    if (!resident) {
      // Couldn't auto-identify → ask for the house code.
      await this.reply(jid, buildAskUnitCodeText());
      session.step = 'AWAITING_UNIT_CODE';
      this.touch(session);
      return;
    }

    await this.sendIplForUnit(jid, resident.houseUnitId);
    this.endFlow(session);
  }

  /**
   * Look up one unit's delinquency in the (cached) report and reply.
   * Used both by the auto-identified path and the typed-code path.
   */
  private async sendIplForUnit(jid: string, unitId: string | null): Promise<void> {
    let report: DelinquentReport;
    try {
      report = await this.getDelinquentReport();
    } catch (err: any) {
      this.logger.error(`Delinquency lookup failed: ${err?.message ?? err}`);
      await this.reply(jid, buildTemporarilyUnavailableText());
      return;
    }

    if (!unitId) {
      await this.reply(jid, buildNoOutstandingText(null, report.year));
      return;
    }

    const unit: DelinquentUnit | undefined = report.units.find(
      (u) => u.unitId === unitId,
    );
    if (!unit) {
      await this.reply(jid, buildNoOutstandingText(null, report.year));
      return;
    }

    const monthRange = formatMonthRange(
      unit.streakStartMonth,
      unit.asOfMonth,
      report.year,
    );
    const amount = (Number(unit.monthlyRate) || 0) * unit.streakCount;

    await this.reply(
      jid,
      buildIplOutstandingText({
        name: unit.residentName ?? null,
        unit: unit.unitNumber,
        block: unit.blockName,
        monthRange,
        months: unit.streakCount,
        amount,
        paymentInfo: this.resolvePaymentInfo(),
        companyName:
          this.config.get<string>('COMPANY_NAME') || 'Golden Hills Finance',
      }),
    );
  }

  // ------------------------------------------------------------------
  // Flow 1b — Cek Iuran Warga
  // ------------------------------------------------------------------

  /** Option 3: identify the resident, then surface their Iuran Warga outstanding. */
  private async runIuranFlow(jid: string, session: BotSession): Promise<void> {
    const resident = await this.identifyResident(jid);

    if (!resident) {
      // Couldn't auto-identify → ask for the house code (routed back here via cekKind).
      await this.reply(jid, buildAskUnitCodeText());
      session.cekKind = 'IURAN';
      session.step = 'AWAITING_UNIT_CODE';
      this.touch(session);
      return;
    }

    await this.sendIuranForUnit(jid, resident.houseUnitId);
    this.endFlow(session);
  }

  /**
   * Look up one unit's Iuran Warga outstanding and reply. Used by the
   * auto-identified path and the typed-code fallback.
   */
  private async sendIuranForUnit(jid: string, unitId: string | null): Promise<void> {
    let outstanding;
    try {
      // No cached report equivalent to IPL's delinquency report — this is one
      // unit, fetched per call.
      outstanding = unitId
        ? await this.residentPayments.getUnitOutstanding(unitId)
        : null;
    } catch (err: any) {
      this.logger.error(`Iuran outstanding lookup failed: ${err?.message ?? err}`);
      await this.reply(jid, buildTemporarilyUnavailableText());
      return;
    }

    const year = new Date().getFullYear();
    if (!outstanding || outstanding.payableMonths.length === 0) {
      await this.reply(jid, buildNoIuranOutstandingText(outstanding?.residentName ?? null, year));
      return;
    }

    const payable = outstanding.payableMonths;
    const monthRange = formatMonthRange(
      payable[0].month,
      payable[payable.length - 1].month,
      year,
    );

    await this.reply(
      jid,
      buildIuranOutstandingText({
        name: outstanding.residentName,
        unit: outstanding.unitNumber,
        block: outstanding.blockName,
        monthRange,
        months: payable.length,
        amount: outstanding.totalAmount,
        paymentInfo: this.resolvePaymentInfo(),
        companyName:
          this.config.get<string>('COMPANY_NAME') || 'Golden Hills Finance',
      }),
    );
  }

  // ------------------------------------------------------------------
  // Flow 2 — Bayar IPL
  // ------------------------------------------------------------------

  /** Option 2: pay IPL. Resident self-pay (unit auto-detected) or coordinator. */
  private async runPayIplFlow(jid: string, session: BotSession): Promise<void> {
    return this.runPayFlow(jid, session, 'IPL');
  }

  /** Option 4: pay Iuran Warga. Same shape as Bayar IPL, different `kind`. */
  private async runPayIuranFlow(jid: string, session: BotSession): Promise<void> {
    return this.runPayFlow(jid, session, 'IURAN');
  }

  /**
   * Shared pay-flow entry. IPL and Iuran Warga differ only in `kind` here —
   * the coordinator/self-pay detection, unit resolution, month choice and proof
   * upload are identical and handled by the shared handlers below.
   */
  private async runPayFlow(
    jid: string,
    session: BotSession,
    kind: PayKind,
  ): Promise<void> {
    const resident = await this.identifyResident(jid);

    if (!resident) {
      await this.reply(jid, buildPayUnregisteredText());
      this.endFlow(session);
      return;
    }

    const submittedByUserId = await this.resolveSubmitterUserId(resident.userId);

    // Coordinator path — they may pay for any unit in their block(s).
    const blocks = await this.getCoordinatorBlocks(resident.id);
    if (blocks.length > 0) {
      const blockIds = blocks.map((b) => b.id);
      const label = blocks
        .map((b) => b.blockName || b.blockCode)
        .filter(Boolean)
        .join(', ');
      session.pay = { kind, isCoordinator: true, blockIds, submittedByUserId };
      session.step = 'AWAITING_PAY_UNIT';
      await this.reply(jid, buildAskPayUnitText(label));
      this.touch(session);
      return;
    }

    // Regular resident — unit auto-detected from their record, no input needed.
    if (!resident.houseUnitId) {
      await this.reply(jid, buildPayNoUnitText());
      this.endFlow(session);
      return;
    }
    await this.beginPayForUnit(jid, session, {
      kind,
      houseUnitId: resident.houseUnitId,
      isCoordinator: false,
      submittedByUserId,
      blockIds: [],
    });
  }

  /** Coordinator typed a unit code → validate it's in their block, then pay. */
  private async handlePayUnit(
    jid: string,
    text: string,
    session: BotSession,
  ): Promise<void> {
    const blockIds = session.pay?.blockIds ?? [];
    const unit = findUnitByCode(await this.getUnits(), text);
    console.log('unit', unit)
    if (!unit) {
      await this.reply(jid, buildPayUnitNotFoundText());
      this.touch(session);
      return;
    }
    if (!unitBelongsToBlocks(unit.houseBlockId, blockIds)) {
      await this.reply(jid, buildPayUnitOutsideBlockText());
      this.touch(session);
      return;
    }
    await this.beginPayForUnit(jid, session, {
      kind: session.pay?.kind ?? 'IPL',
      houseUnitId: unit.id,
      isCoordinator: true,
      submittedByUserId: session.pay?.submittedByUserId ?? null,
      blockIds,
    });
  }

  /**
   * Resolve the unit's payer + outstanding months, show the summary, and move
   * to AWAITING_PAY_MONTHS. Shared by the resident and coordinator paths, and by
   * both fee kinds (IPL / Iuran Warga) — they branch only on `input.kind` at the
   * outstanding lookup, the payable-month filter, and the summary builder.
   */
  private async beginPayForUnit(
    jid: string,
    session: BotSession,
    input: {
      kind: PayKind;
      houseUnitId: string;
      isCoordinator: boolean;
      submittedByUserId: string | null;
      blockIds: string[];
    },
  ): Promise<void> {
    const unit = await this.prisma.houseUnit.findUnique({
      where: { id: input.houseUnitId },
      include: {
        houseBlock: { select: { blockName: true, blockCode: true } },
        residents: {
          where: { isActive: true, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!unit || unit.deletedAt || !unit.residents.length) {
      await this.reply(jid, buildPayNoUnitText());
      this.endFlow(session);
      return;
    }
    const payer = unit.residents[0];

    let outstanding: any;
    try {
      outstanding =
        input.kind === 'IURAN'
          ? await this.residentPayments.getUnitOutstanding(unit.id)
          : await this.iplPayments.getUnitOutstanding(unit.id);
    } catch (err: any) {
      this.logger.error(`getUnitOutstanding failed: ${err?.message ?? err}`);
      await this.reply(jid, buildTemporarilyUnavailableText());
      this.endFlow(session);
      return;
    }

    // Iuran Warga has no period table — every payable month has periodId null,
    // so the `!!periodId` filter MUST be skipped for IURAN or all months get
    // dropped and the flow always says "no outstanding".
    const payable = (
      input.kind === 'IURAN'
        ? outstanding.payableMonths
        : outstanding.payableMonths.filter((m: PayableMonth) => !!m.periodId)
    ) as PayableMonth[];
    // Even with zero tunggakan the resident may still pay AHEAD (bayar di muka),
    // so an empty payable list is NOT a dead-end — we proceed to the month-choice
    // step and the summary offers a pure-advance prompt instead of bailing out.
    const outstandingCount = payable.length;
    const monthlyRate = Number(outstanding.monthlyRate) || 0;
    const monthRangeLabel =
      outstandingCount > 0
        ? formatMonthRangeCrossYear(
            { month: payable[0].month, year: payable[0].year },
            {
              month: payable[outstandingCount - 1].month,
              year: payable[outstandingCount - 1].year,
            },
          )
        : null;
    const name =
      [payer.firstName, payer.lastName].filter(Boolean).join(' ') || null;

    session.pay = {
      kind: input.kind,
      isCoordinator: input.isCoordinator,
      blockIds: input.blockIds,
      submittedByUserId: input.submittedByUserId,
      residentId: payer.id,
      houseUnitId: unit.id,
      unitNumber: unit.unitNumber,
      monthlyRate,
      payableMonths: payable,
      // For deriving the per-sqm baseRate fallback when auto-creating a future
      // IPL period and no active period exists (resolveCurrentBaseRate's fallback).
      landArea: Number(unit.landArea) || 0,
      iplPercentage: Number(unit.iplPercentage) || 0,
    };
    session.step = 'AWAITING_PAY_MONTHS';

    const summaryArgs = {
      name,
      unit: unit.unitNumber,
      block: unit.houseBlock?.blockName ?? null,
      monthRangeLabel,
      outstandingCount,
      monthlyRate,
      totalAmount: monthlyRate * outstandingCount,
      paymentInfo: this.resolvePaymentInfo(),
      advanceCap: MAX_ADVANCE_MONTHS,
    };
    await this.reply(
      jid,
      input.kind === 'IURAN'
        ? buildIuranPaySummaryText(summaryArgs)
        : buildPaySummaryText(summaryArgs),
    );
    this.touch(session);
  }

  /**
   * Resident chose how many months to pay in total. May exceed the tunggakan
   * count — the excess is filled with future (bayar di muka) months. For IPL,
   * future months carry `periodId: null` here and are resolved (period created
   * on demand) only at proof-upload time, so abandoning the flow leaves no
   * orphan periods.
   */
  private async handlePayMonths(
    jid: string,
    text: string,
    session: BotSession,
  ): Promise<void> {
    const pay = session.pay;
    if (!pay) {
      await this.showMenu(jid, session);
      return;
    }
    const outstanding = pay.payableMonths ?? [];
    const count = parseMonthCount(text, {
      outstanding: outstanding.length,
      maxTotal: MAX_ADVANCE_MONTHS,
    });
    if (!count) {
      const reason = isMonthCountOverCap(text, MAX_ADVANCE_MONTHS)
        ? 'over-cap'
        : 'invalid';
      await this.reply(
        jid,
        buildPayMonthChoiceInvalidText(MAX_ADVANCE_MONTHS, reason),
      );
      this.touch(session);
      return;
    }

    const chosen = await this.resolveChosenMonthsWithAdvance(outstanding, count);
    const monthlyRate = Number(pay.monthlyRate) || 0;
    const total = monthlyRate * chosen.length;
    const monthRangeLabel = formatMonthRangeCrossYear(
      { month: chosen[0].month, year: chosen[0].year },
      {
        month: chosen[chosen.length - 1].month,
        year: chosen[chosen.length - 1].year,
      },
    );
    const advanceMonths = Math.max(0, count - outstanding.length);

    // Stash the chosen months on the session so the proof step knows the periods.
    session.pay = { ...pay, payableMonths: chosen } as PayContext;
    session.step = 'AWAITING_PAY_PROOF';

    const proofPromptArgs = {
      monthRangeLabel,
      monthCount: chosen.length,
      totalAmount: total,
      paymentInfo: this.resolvePaymentInfo(),
      advanceMonths,
    };
    await this.reply(
      jid,
      pay.kind === 'IURAN'
        ? buildIuranPayProofPromptText(proofPromptArgs)
        : buildPayProofPromptText(proofPromptArgs),
    );
    this.touch(session);
  }

  /**
   * Build the exact `totalCount` months to pay: the oldest tunggakan months
   * first, then — if `totalCount` exceeds the tunggakan — future months
   * appended chronologically starting the month after the last payable month
   * (rolling Dec→Jan into the next year). When there is no tunggakan, the
   * anchor is the current month, so the first future slot is next month.
   *
   * Pure-ish: the future slots are computed by `computeFutureMonthSlots`; this
   * method only shapes them into `PayableMonth` (periodId null for IPL future
   * months — resolved lazily at proof time).
   */
  private async resolveChosenMonthsWithAdvance(
    outstanding: PayableMonth[],
    totalCount: number,
  ): Promise<PayableMonth[]> {
    const base = outstanding.slice(0, Math.min(outstanding.length, totalCount));
    if (base.length >= totalCount) return base;

    const now = new Date();
    const anchor =
      outstanding.length > 0
        ? {
            month: outstanding[outstanding.length - 1].month,
            year: outstanding[outstanding.length - 1].year,
          }
        : { month: now.getMonth() + 1, year: now.getFullYear() };

    const slots = computeFutureMonthSlots(
      anchor.month,
      anchor.year,
      totalCount - base.length,
    );
    // Both kinds carry periodId null for future months: Iuran Warga has no
    // period table at all; IPL resolves (creating the period on demand) at
    // proof-upload time in handlePayProof.
    const future: PayableMonth[] = slots.map((s) => ({
      month: s.month,
      year: s.year,
      periodId: null,
    }));
    return [...base, ...future];
  }

  /** Proof-upload step: download the bukti transfer and create the PENDING payment. */
  private async handlePayProof(
    jid: string,
    msg: any,
    session: BotSession,
  ): Promise<void> {
    const ctx = session.pay;
    if (!ctx?.residentId || !ctx?.payableMonths?.length) {
      await this.showMenu(jid, session);
      return;
    }

    if (!hasMedia(msg)) {
      await this.reply(jid, buildPayProofAwaitingText());
      this.touch(session);
      return;
    }

    // Download the attachment.
    let downloaded;
    try {
      downloaded = await this.client.downloadMedia(msg);
    } catch (err: any) {
      this.logger.error(`downloadMedia failed for ${jid}: ${err?.message ?? err}`);
      await this.reply(jid, buildPayFailedText());
      this.endFlow(session);
      return;
    }
    if (!downloaded) {
      await this.reply(jid, buildPayFailedText());
      this.endFlow(session);
      return;
    }
    if (!isProofMimeType(downloaded.mimeType)) {
      await this.reply(jid, buildPayProofUnsupportedText());
      this.touch(session);
      return;
    }

    // Need a real User to record as `submittedBy`.
    const submittedByUserId = ctx.submittedByUserId;
    if (!submittedByUserId) {
      await this.reply(jid, buildPayCannotAttributeText());
      this.endFlow(session);
      return;
    }

    // Save to the temp dir (mirrors the REST multer convention) then let the
    // service rename it to BTF-… under uploads/<unit>/.
    const ext = path.extname(downloaded.fileName) || '.bin';
    const tempName = `temp_${uuidv4()}${ext}`;
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    const tempDiskPath = path.join(tempDir, tempName);
    const tempWebPath = `/uploads/temp/${tempName}`;
    try {
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(tempDiskPath, downloaded.buffer);
    } catch (err: any) {
      this.logger.error(`Failed to write bukti temp file: ${err?.message ?? err}`);
      await this.reply(jid, buildPayFailedText());
      this.endFlow(session);
      return;
    }

    try {
      // For IPL, resolve periodIds for future (bayar di muka) months still
      // carrying periodId null — creating the IplPeriod on demand (rate locked
      // to the current baseRate). Done at proof-upload time, so a resident who
      // abandons after the prompt leaves no orphan periods.
      if (ctx.kind === 'IPL') {
        ctx.payableMonths = await this.resolveIplPeriodIds(ctx.payableMonths, ctx);
      }

      let referenceNumber: string;
      if (ctx.kind === 'IURAN') {
        const payment = await this.residentPayments.createBotPayment({
          residentId: ctx.residentId,
          monthCount: ctx.payableMonths.length,
          paymentDate: new Date(),
          proofFilePath: tempWebPath,
          proofFileName: downloaded.fileName || tempName,
          proofFileSize: downloaded.buffer.length,
          proofMimeType: downloaded.mimeType,
          submittedByUserId,
        });
        referenceNumber = payment?.referenceNumber ?? '-';
      } else {
        const payments = await this.iplPayments.createBotPayment({
          residentId: ctx.residentId,
          // periodIds resolved above: existing tunggakan periods + any
          // auto-created future periods for bayar di muka months.
          periodIds: ctx.payableMonths.map((m) => m.periodId!),
          paymentDate: new Date(),
          proofFilePath: tempWebPath,
          proofFileName: downloaded.fileName || tempName,
          proofFileSize: downloaded.buffer.length,
          proofMimeType: downloaded.mimeType,
          submittedByUserId,
        });
        referenceNumber = payments[0]?.referenceNumber ?? '-';
      }
      await this.reply(jid, buildPayReceivedText(referenceNumber));
    } catch (err: any) {
      const message = err?.message ?? '';
      this.logger.error(`createBotPayment failed for ${jid}: ${message}`);
      if (/sudah ada|already exist/i.test(message)) {
        await this.reply(jid, buildPayDuplicateText());
      } else {
        await this.reply(jid, buildPayFailedText());
      }
    } finally {
      this.endFlow(session);
    }
  }

  /**
   * Resolve periodIds for any future IPL months still carrying `periodId: null`
   * — creating the `IplPeriod` on demand (rate locked to the current baseRate).
   * Existing tunggakan months already have their periodId and pass through
   * unchanged. Throws `BadRequestException` if a future period exists but is not
   * ACTIVE — the caller surfaces that as a generic failure.
   */
  private async resolveIplPeriodIds(
    months: PayableMonth[],
    ctx: PayContext,
  ): Promise<PayableMonth[]> {
    if (!months.some((m) => !m.periodId)) return months;
    const fallbackDerived = this.deriveBaseRateFromUnit(ctx);
    const baseRate = await this.iplPeriods.resolveCurrentBaseRate(fallbackDerived);
    const resolved: PayableMonth[] = [];
    for (const m of months) {
      if (m.periodId) {
        resolved.push(m);
        continue;
      }
      const period = await this.iplPeriods.ensurePeriod(m.month, m.year, baseRate);
      resolved.push({ ...m, periodId: period.id });
    }
    return resolved;
  }

  /**
   * Per-sqm baseRate derived from the unit's monthly rate — only used as the
   * fallback when `resolveCurrentBaseRate` finds no ACTIVE period anywhere
   * (essentially never in practice). From `calculateIplAmount`:
   *   monthlyRate = landArea × baseRate × iplPercentage/100
   *   ⇒ baseRate  = monthlyRate / (landArea × iplPercentage/100)
   * Guards divide-by-zero; defaults to 2500 when not derivable.
   */
  private deriveBaseRateFromUnit(ctx: PayContext): number {
    const landArea = Number(ctx.landArea) || 0;
    const pct = (Number(ctx.iplPercentage) || 0) / 100;
    const monthlyRate = Number(ctx.monthlyRate) || 0;
    if (landArea > 0 && pct > 0 && monthlyRate > 0) {
      const rate = monthlyRate / (landArea * pct);
      if (Number.isFinite(rate) && rate > 0) return rate;
    }
    return 2500;
  }

  // ------------------------------------------------------------------
  // Approve/reject notifications (pushed via EventEmitter by IplPaymentsService)
  // ------------------------------------------------------------------

  @OnEvent('ipl.payment.approved')
  async handlePaymentApproved(payload: {
    paymentId: string;
    groupPaymentIds: string[];
    referenceNumber: string;
  }): Promise<void> {
    if (this.botDisabled) return;
    try {
      const payment = await this.iplPayments.findById(payload.paymentId);
      const resident: any = payment?.resident;

      // Recipients: the unit owner (homeowner) AND — when someone else recorded
      // the payment on their behalf (e.g. the block coordinator) — that
      // submitter too. Without the submitter here, a coordinator-pay for a
      // resident without WhatsApp would silently reach nobody (the old code
      // bailed as soon as the owner had no reachable number).
      const recipientJids = await this.resolveApprovalRecipients(payment);
      if (recipientJids.length === 0) {
        this.logger.warn(
          `No reachable WhatsApp recipient for approved payment ${payload.paymentId} (${payment?.paymentNumber ?? '?'}) — owner and submitter both lack a valid WA number.`,
        );
        return;
      }
      this.logger.log(
        `Notifying ${recipientJids.length} WA recipient(s) for approved payment ${payment?.paymentNumber ?? payload.paymentId}: ${recipientJids.join(', ')}`,
      );

      const name = this.residentName(resident);
      const text = buildPayApprovedText(name, payload.referenceNumber);

      // Generate each month's KWT once (idempotent), then deliver to every
      // recipient — avoids re-running PDF generation per recipient.
      const ids = payload.groupPaymentIds?.length
        ? payload.groupPaymentIds
        : [payload.paymentId];
      const receipts: { diskPath: string; fileName: string }[] = [];
      for (const pid of ids) {
        try {
          const receiptPath = await this.iplReceipts.generateReceipt(pid);
          const diskPath = path.join(process.cwd(), receiptPath);
          if (fs.existsSync(diskPath)) {
            receipts.push({ diskPath, fileName: path.basename(receiptPath) });
          }
        } catch (err: any) {
          this.logger.error(`KWT generate failed for ${pid}: ${err?.message ?? err}`);
        }
      }

      for (const jid of recipientJids) {
        await this.reply(jid, text);
        for (const r of receipts) {
          await this.sendDocument(jid, {
            filePath: r.diskPath,
            fileName: r.fileName,
            mimetype: 'application/pdf',
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`handlePaymentApproved failed: ${err?.message ?? err}`);
    }
  }

  /**
   * Build the deduplicated list of WhatsApp JIDs to notify on approval: the
   * unit owner, plus — when the payment was submitted by someone other than the
   * owner (e.g. a block coordinator paying on their behalf) — that submitter.
   * Returns only reachable (valid) JIDs; empty when neither has a usable number.
   */
  private async resolveApprovalRecipients(payment: any): Promise<string[]> {
    const jids = new Set<string>();

    // 1. Homeowner / unit owner.
    const ownerJid = payment?.resident?.phoneNumber
      ? this.residentJid(payment.resident.phoneNumber)
      : null;
    if (ownerJid) jids.add(ownerJid);

    // 2. Submitter (whoever recorded/paid the IPL). For a coordinator-pay this
    //    is the block coordinator; for self-pay it's the owner themselves
    //    (already added above, so the Set dedupes to a single recipient).
    const submitterUserId: string | null | undefined = payment?.submittedBy;
    const ownerId: string | null | undefined = payment?.resident?.id;
    if (submitterUserId) {
      const submitter = await this.prisma.resident.findFirst({
        where: { userId: submitterUserId, deletedAt: null },
        select: { id: true, phoneNumber: true },
      });
      if (submitter && submitter.id !== ownerId && submitter.phoneNumber) {
        const submitterJid = this.residentJid(submitter.phoneNumber);
        if (submitterJid) jids.add(submitterJid);
      }
    }

    return Array.from(jids);
  }

  @OnEvent('ipl.payment.rejected')
  async handlePaymentRejected(payload: {
    paymentId: string;
    referenceNumber: string;
    rejectionReason?: string;
  }): Promise<void> {
    if (this.botDisabled) return;
    try {
      const payment = await this.iplPayments.findById(payload.paymentId);
      const resident: any = payment?.resident;
      const jid = resident?.phoneNumber ? this.residentJid(resident.phoneNumber) : null;
      if (!jid) return;
      const name = this.residentName(resident);
      await this.reply(
        jid,
        buildPayRejectedText(name, payload.referenceNumber, payload.rejectionReason ?? null),
      );
    } catch (err: any) {
      this.logger.error(`handlePaymentRejected failed: ${err?.message ?? err}`);
    }
  }

  // ------------------------------------------------------------------
  // Iuran Warga verification notification (pushed via EventEmitter by
  // ResidentPaymentsService.verifyPayment)
  // ------------------------------------------------------------------

  @OnEvent('resident.payment.verified')
  async handleResidentPaymentVerified(payload: {
    paymentId: string;
    referenceNumber: string | null;
  }): Promise<void> {
    if (this.botDisabled) return;
    try {
      const payment: any = await this.residentPayments.findById(payload.paymentId);
      const resident: any = payment?.resident;

      const recipientJids = await this.resolveIuranVerifiedRecipients(payment);
      if (recipientJids.length === 0) {
        this.logger.warn(
          `No reachable WhatsApp recipient for verified iuran payment ${payload.paymentId} (${payment?.paymentNumber ?? '?'}).`,
        );
        return;
      }
      this.logger.log(
        `Notifying ${recipientJids.length} WA recipient(s) for verified iuran payment ${payment?.paymentNumber ?? payload.paymentId}: ${recipientJids.join(', ')}`,
      );

      const name = this.residentName(resident);
      const text = buildIuranPayApprovedText(name, payload.referenceNumber ?? '-');

      // The receipt was already generated by the service's verify flow; this
      // call is idempotent and just returns the existing file path.
      const receipts: { diskPath: string; fileName: string }[] = [];
      try {
        const receiptPath = await this.residentPaymentReceipts.generateReceipt(
          payload.paymentId,
        );
        const diskPath = path.join(process.cwd(), receiptPath);
        if (fs.existsSync(diskPath)) {
          receipts.push({ diskPath, fileName: path.basename(receiptPath) });
        }
      } catch (err: any) {
        this.logger.error(
          `Iuran receipt generate failed for ${payload.paymentId}: ${err?.message ?? err}`,
        );
      }

      for (const jid of recipientJids) {
        await this.reply(jid, text);
        for (const r of receipts) {
          await this.sendDocument(jid, {
            filePath: r.diskPath,
            fileName: r.fileName,
            mimetype: 'application/pdf',
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`handleResidentPaymentVerified failed: ${err?.message ?? err}`);
    }
  }

  /**
   * Recipients for a verified Iuran Warga payment: the unit owner, plus — when
   * the payment was created by someone other than the owner (e.g. a block
   * coordinator) — that submitter. Mirror of {@link resolveApprovalRecipients},
   * but ResidentPayment records the submitter on `createdBy` (IPL uses
   * `submittedBy`).
   */
  private async resolveIuranVerifiedRecipients(payment: any): Promise<string[]> {
    const jids = new Set<string>();

    // 1. Homeowner / unit owner.
    const ownerJid = payment?.resident?.phoneNumber
      ? this.residentJid(payment.resident.phoneNumber)
      : null;
    if (ownerJid) jids.add(ownerJid);

    // 2. Submitter (whoever created the payment). For a coordinator-pay this is
    //    the coordinator; for self-pay it's the owner (dedupes to one).
    const createdByUserId: string | null | undefined = payment?.createdBy;
    const ownerId: string | null | undefined = payment?.resident?.id;
    if (createdByUserId) {
      const submitter = await this.prisma.resident.findFirst({
        where: { userId: createdByUserId, deletedAt: null },
        select: { id: true, phoneNumber: true },
      });
      if (submitter && submitter.id !== ownerId && submitter.phoneNumber) {
        const submitterJid = this.residentJid(submitter.phoneNumber);
        if (submitterJid) jids.add(submitterJid);
      }
    }

    return Array.from(jids);
  }

  // ------------------------------------------------------------------
  // Identity / submitter helpers
  // ------------------------------------------------------------------

  /**
   * Resolve the incoming JID to a resident. Matches the phone digits directly;
   * for a Linked-Identity (`@lid`) JID the local part is a LID, not a phone, so
   * we look the LID up in the (phone→LID) resident map. Falls back to a reverse
   * LID→phone resolve (cache-only) in case that mapping is already known.
   * Returns null when nothing matches (bot then asks for a house code / rejects).
   */
  private async identifyResident(jid: string): Promise<ResidentLite | null> {
    const residents = await this.getResidents();
    let resident = matchResidentByPhone(residents, jidToDigits(jid));
    if (!resident && jid.endsWith('@lid')) {
      const lidUser = (jid.split('@')[0] || '').split(':')[0];
      if (lidUser) {
        const byLidUser = await this.getLidResidentMap();
        resident = byLidUser.get(lidUser) ?? null;
      }
      // Last-ditch reverse resolve (cheap, cache-only — works only if already mapped).
      if (!resident) {
        const phoneJid = await this.client.resolveLidToPhoneJid(jid);
        if (phoneJid) {
          resident = matchResidentByPhone(residents, jidToDigits(phoneJid));
        }
      }
    }
    return resident;
  }

  /** Blocks coordinated by this resident (correct FK path — coordinatorId). */
  private async getCoordinatorBlocks(
    residentId: string,
  ): Promise<{ id: string; blockCode: string; blockName: string | null }[]> {
    return this.prisma.houseBlock.findMany({
      where: { coordinatorId: residentId, deletedAt: null },
      select: { id: true, blockCode: true, blockName: true },
    });
  }

  /**
   * Resolve the User id to record as `submittedBy`. Prefers the resident's own
   * app account; falls back to the configured system bot user for self-pay
   * residents who don't have one. Returns null when neither is available.
   */
  private async resolveSubmitterUserId(
    userId: string | null | undefined,
  ): Promise<string | null> {
    if (userId) return userId;
    return this.resolveSystemUserId();
  }

  private async resolveSystemUserId(): Promise<string | null> {
    if (this.systemUserIdCache !== undefined) return this.systemUserIdCache;
    const fromConfig = this.config.get<string>('whatsapp.bot.systemUserId');
    if (fromConfig && fromConfig.trim()) {
      this.systemUserIdCache = fromConfig.trim();
      return this.systemUserIdCache;
    }
    try {
      const user = await this.prisma.user.findUnique({
        where: { username: 'wa-bot-system' },
        select: { id: true },
      });
      this.systemUserIdCache = user?.id ?? null;
    } catch {
      this.systemUserIdCache = null;
    }
    return this.systemUserIdCache;
  }

  /** WhatsApp JID for a resident phone, or null when it can't be normalized. */
  private residentJid(phone: string | null | undefined): string | null {
    const r = normalizeToWaJid(phone);
    return r.valid ? r.jid : null;
  }

  private residentName(resident: any): string | null {
    if (!resident) return null;
    const name = [resident.firstName, resident.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return name || null;
  }

  // ------------------------------------------------------------------
  // Caches (TTL-bounded so stale data self-heals)
  // ------------------------------------------------------------------

  private async getResidents(): Promise<ResidentLite[]> {
    if (
      this.residentsCache.at &&
      Date.now() - this.residentsCache.at < this.residentCacheTtlMs
    ) {
      return this.residentsCache.list;
    }
    const rows = (await this.prisma.resident.findMany({
      where: { deletedAt: null, isActive: true, phoneNumber: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        alternatePhone: true,
        houseBlockId: true,
        houseUnitId: true,
        unitNumber: true,
        userId: true,
      },
    })) as ResidentLite[];
    this.residentsCache = { at: Date.now(), list: rows };
    return rows;
  }

  private async getUnits(): Promise<UnitLite[]> {
    if (
      this.unitsCache.at &&
      Date.now() - this.unitsCache.at < this.residentCacheTtlMs
    ) {
      return this.unitsCache.list;
    }
    const rows = (await this.prisma.houseUnit.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, unitCode: true, unitNumber: true, houseBlockId: true },
    })) as UnitLite[];
    this.unitsCache = { at: Date.now(), list: rows };
    return rows;
  }

  /**
   * LID-user → resident map, for identifying `@lid` senders. Each resident's
   * phone is resolved to its LID via the client (one batched usync). The LID
   * user (local part, device suffix stripped) keys the map, so both `xxxxx@lid`
   * and `xxxxx:7@lid` resolve. Phone→LID is server-backed, so this works even
   * for contacts the bot has never mapped (unlike the reverse LID→phone cache).
   */
  private async getLidResidentMap(): Promise<Map<string, ResidentLite>> {
    if (
      this.lidResidentCache.at &&
      Date.now() - this.lidResidentCache.at <
      WhatsappBotService.LID_MAP_TTL_MS
    ) {
      return this.lidResidentCache.byLidUser;
    }

    const residents = await this.getResidents();
    const phoneJids: string[] = [];
    const byPnUser = new Map<string, ResidentLite>();
    for (const r of residents) {
      for (const phone of [r.phoneNumber, r.alternatePhone]) {
        if (!phone) continue;
        const norm = normalizeToWaJid(phone);
        if (!norm.valid || !norm.normalized) continue;
        phoneJids.push(`${norm.normalized}@s.whatsapp.net`);
        byPnUser.set(norm.normalized, r);
      }
    }

    const byLidUser = new Map<string, ResidentLite>();
    try {
      if (phoneJids.length) {
        const pairs = await this.client.resolvePhoneJidsToLids(phoneJids);
        for (const { pn, lid } of pairs) {
          const resident = byPnUser.get((pn.split('@')[0] || '').split(':')[0]);
          if (!resident) continue;
          const lidUser = (lid.split('@')[0] || '').split(':')[0];
          if (lidUser) byLidUser.set(lidUser, resident);
        }
      }
    } catch (err: any) {
      this.logger.warn(`LID→resident map build failed: ${err?.message ?? err}`);
    }

    this.lidResidentCache = { at: Date.now(), byLidUser };
    this.logger.log(`LID→resident map built: ${byLidUser.size} entry(s).`);
    return byLidUser;
  }

  private async getDelinquentReport(): Promise<DelinquentReport> {
    const year = new Date().getFullYear();
    if (
      this.delinquentCache.report &&
      this.delinquentCache.year === year &&
      this.delinquentCache.at &&
      Date.now() - this.delinquentCache.at <
      WhatsappBotService.DELINQUENT_CACHE_TTL_MS
    ) {
      return this.delinquentCache.report;
    }
    const report = await this.iplPayments.getDelinquentUnits({ year });
    this.delinquentCache = { year, at: Date.now(), report };
    return report;
  }

  // ------------------------------------------------------------------
  // Session housekeeping
  // ------------------------------------------------------------------

  private getOrCreateSession(jid: string): BotSession {
    let session = this.sessions.get(jid);
    if (!session) {
      session = { step: 'IDLE', lastActivity: Date.now() };
      this.sessions.set(jid, session);
    }
    return session;
  }

  private touch(session: BotSession): void {
    session.lastActivity = Date.now();
  }

  /** Return to idle — the next message will re-show the menu. */
  private endFlow(session: BotSession): void {
    session.step = 'IDLE';
    delete session.pay;
    delete session.cekKind;
    this.touch(session);
  }

  private startSweep(): void {
    const interval = Math.min(this.sessionTtlMs, 5 * 60_000);
    this.sweepTimer = setInterval(() => {
      const cutoff = Date.now() - this.sessionTtlMs;
      for (const [jid, session] of this.sessions) {
        if (session.lastActivity < cutoff) this.sessions.delete(jid);
      }
    }, interval);
  }

  // ------------------------------------------------------------------
  // Send
  // ------------------------------------------------------------------

  private async reply(jid: string, text: string): Promise<void> {
    try {
      await this.client.sendText(jid, text);
    } catch (err: any) {
      this.logger.error(`Failed to reply to ${jid}: ${err?.message ?? err}`);
    }
  }

  private async sendDocument(
    jid: string,
    input: { filePath: string; fileName: string; mimetype?: string; caption?: string },
  ): Promise<void> {
    try {
      await this.client.sendDocument(jid, input);
    } catch (err: any) {
      this.logger.error(`Failed to send document to ${jid}: ${err?.message ?? err}`);
    }
  }

  /** Payment/contact line — same resolution as the blast service. */
  private resolvePaymentInfo(): string {
    const fromConfig = this.config.get<string>('whatsapp.paymentInfo');
    if (fromConfig && fromConfig.trim()) return fromConfig.trim();
    return this.config.get<string>('COMPANY_PHONE') || 'Hubungi kantor paguyuban';
  }
}
