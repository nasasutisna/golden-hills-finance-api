import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DelinquentReport,
  DelinquentUnit,
  formatMonthRange,
} from '../ipl-payments/helpers/delinquent-units.helper';
import { BlastStatus, RecipientStatus } from './dto/enums';
import { QueryBlastsDto } from './dto/query-blasts.dto';
import { SendTestDto } from './dto/send-test.dto';
import { TriggerBlastDto } from './dto/trigger-blast.dto';
import {
  buildMessage,
  DEFAULT_MESSAGE_TEMPLATE,
  MessageContext,
} from './helpers/message-template.helper';
import { normalizeToWaJid } from './helpers/phone.helper';
import { WhatsappBlastRepository } from './whatsapp-blast.repository';
import { WhatsappClientService } from './whatsapp-client.service';

interface BuiltTarget {
  unit: DelinquentUnit;
  monthRange: string;
  outstandingAmount: number;
  message: string;
  /** Normalized phone (valid ? has jid : has error). */
  phone: ReturnType<typeof normalizeToWaJid>;
}

@Injectable()
export class WhatsappBlastService {
  private readonly logger = new Logger(WhatsappBlastService.name);

  constructor(
    private readonly client: WhatsappClientService,
    private readonly repository: WhatsappBlastRepository,
    private readonly config: ConfigService,
  ) {}

  // ------------------------------------------------------------------
  // Preview (no sending, no DB writes)
  // ------------------------------------------------------------------

  /** Target list + computed message per recipient for a given year/block. */
  async getDelinquentPreview(query: {
    year?: number;
    houseBlockId?: string;
  }) {
    const report = await this.fetchReport(query);
    const targets = this.buildTargets(report);

    const recipients = targets.map((t) => ({
      unitId: t.unit.unitId,
      unitNumber: t.unit.unitNumber,
      blockCode: t.unit.blockCode,
      blockName: t.unit.blockName,
      residentName: t.unit.residentName,
      rawPhone: t.unit.phoneNumber ?? null,
      normalizedPhone: t.phone.normalized,
      phoneValid: t.phone.valid,
      phoneError: t.phone.error,
      outstandingMonths: t.unit.streakCount,
      monthRange: t.monthRange,
      outstandingAmount: t.outstandingAmount,
      messagePreview: t.message,
    }));

    const withPhone = recipients.filter((r) => r.phoneValid).length;

    return {
      year: report.year,
      asOfMonth: report.asOfMonth,
      asOfLabel: report.asOfLabel,
      houseBlockId: query.houseBlockId ?? null,
      count: recipients.length,
      withPhone,
      withoutPhone: recipients.length - withPhone,
      recipients,
    };
  }

  // ------------------------------------------------------------------
  // Trigger a blast (dry-run or real)
  // ------------------------------------------------------------------

  async triggerBlast(dto: TriggerBlastDto, userId: string) {
    const dryRun = dto.dryRun === true;

    if (!dryRun && !this.client.isConnected()) {
      throw new BadRequestException(
        'WhatsApp belum terhubung. Lakukan pairing QR (GET /whatsapp-blast/status lalu POST /whatsapp-blast/connect) sebelum menjalankan blast.',
      );
    }

    const report = await this.fetchReport(dto);
    const targets = this.buildTargets(report);
    const template =
      this.config.get<string>('whatsapp.messageTemplate') || DEFAULT_MESSAGE_TEMPLATE;

    // 1. Create the batch header
    const batchNo = await this.repository.nextBatchNo();
    const batch = await this.repository.createBatch({
      batchNo,
      year: report.year,
      asOfMonth: report.asOfMonth,
      houseBlockId: dto.houseBlockId ?? null,
      status: BlastStatus.RUNNING,
      dryRun,
      messageTemplate: template,
      triggeredById: userId,
      startedAt: new Date(),
      note: dto.note ?? null,
      totalRecipients: targets.length,
    });

    // 2. Persist recipient rows (PENDING when phone valid, SKIPPED when not)
    type PendingRow = { rowId: string; target: BuiltTarget; willSend: boolean };
    const rows: PendingRow[] = [];
    for (const target of targets) {
      const willSend = target.phone.valid;
      const row = await this.repository.createRecipient({
        blastId: batch.id,
        unitId: target.unit.unitId,
        residentName: target.unit.residentName,
        unitNumber: target.unit.unitNumber,
        blockCode: target.unit.blockCode,
        blockName: target.unit.blockName,
        rawPhone: target.unit.phoneNumber,
        normalizedPhone: target.phone.normalized,
        status: willSend ? RecipientStatus.PENDING : RecipientStatus.SKIPPED,
        errorMessage: willSend ? null : target.phone.error,
        outstandingMonths: target.unit.streakCount,
        outstandingAmount: target.outstandingAmount,
      });
      rows.push({ rowId: row.id, target, willSend });
    }

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = rows.filter((r) => !r.willSend).length;

    try {
      if (dryRun) {
        // Mark all valid recipients as SKIPPED (dry) — nothing is sent.
        for (const r of rows) {
          if (r.willSend) {
            await this.repository.updateRecipient(r.rowId, {
              status: RecipientStatus.SKIPPED,
              errorMessage: 'Dry-run — tidak ada pesan yang dikirim',
            });
            skippedCount += 1;
          }
        }
      } else {
        // Real blast: send with small-batch pacing.
        const sendable = rows.filter((r) => r.willSend && r.target.phone.jid);
        const concurrency = Math.max(
          1,
          this.config.get<number>('whatsapp.concurrency') ?? 1,
        );
        const delayMs = this.config.get<number>('whatsapp.sendDelayMs') ?? 2000;

        for (let i = 0; i < sendable.length; i += concurrency) {
          const chunk = sendable.slice(i, i + concurrency);
          // eslint-disable-next-line no-await-in-loop
          const results = await Promise.all(chunk.map((r) => this.sendOne(r)));
          for (const ok of results) {
            if (ok) successCount += 1;
            else failedCount += 1;
          }
          if (i + concurrency < sendable.length) {
            // eslint-disable-next-line no-await-in-loop
            await sleep(delayMs);
          }
        }
      }

      await this.repository.updateBatch(batch.id, {
        status: BlastStatus.COMPLETED,
        completedAt: new Date(),
        successCount,
        failedCount,
        skippedCount,
      });

      this.logger.log(
        `Blast ${batchNo} ${dryRun ? '(dry-run) ' : ''}completed: ${successCount} sent, ${failedCount} failed, ${skippedCount} skipped.`,
      );

      return {
        batchId: batch.id,
        batchNo,
        dryRun,
        totalRecipients: targets.length,
        successCount,
        failedCount,
        skippedCount,
      };
    } catch (err: any) {
      // Unexpected failure mid-blast — mark FAILED but keep per-recipient results.
      this.logger.error(`Blast ${batchNo} failed unexpectedly: ${err?.message ?? err}`);
      await this.repository.updateBatch(batch.id, {
        status: BlastStatus.FAILED,
        completedAt: new Date(),
        successCount,
        failedCount,
        skippedCount,
      });
      throw err;
    }
  }

  /** Send one recipient's message. Returns true on success, false on failure. */
  private async sendOne(r: {
    rowId: string;
    target: BuiltTarget;
  }): Promise<boolean> {
    const jid = r.target.phone.jid;
    if (!jid) {
      await this.repository.updateRecipient(r.rowId, {
        status: RecipientStatus.FAILED,
        errorMessage: 'JID WhatsApp tidak tersedia',
      });
      return false;
    }
    try {
      await this.client.sendText(jid, r.target.message);
      await this.repository.updateRecipient(r.rowId, {
        status: RecipientStatus.SENT,
        sentAt: new Date(),
      });
      return true;
    } catch (err: any) {
      await this.repository.updateRecipient(r.rowId, {
        status: RecipientStatus.FAILED,
        errorMessage: String(err?.message ?? err).slice(0, 1000),
      });
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Send a single test message (not logged as a blast)
  // ------------------------------------------------------------------

  async sendTest(dto: SendTestDto) {
    const phone = normalizeToWaJid(dto.phoneNumber);
    if (!phone.valid) {
      throw new BadRequestException(`Nomor tidak valid: ${phone.error}`);
    }
    if (!this.client.isConnected()) {
      throw new BadRequestException(
        'WhatsApp belum terhubung. Lakukan pairing QR terlebih dahulu.',
      );
    }
    const message =
      dto.message?.trim() ||
      `Pesan uji dari sistem Golden Hills Finance — ${new Date().toLocaleString(
        'id-ID',
      )}`;
    const res = await this.client.sendText(phone.jid!, message);
    return { to: phone.normalized, messageId: res.messageId, message };
  }

  // ------------------------------------------------------------------
  // History
  // ------------------------------------------------------------------

  async findMany(query: QueryBlastsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.year) where.year = query.year;
    if (query.houseBlockId) where.houseBlockId = query.houseBlockId;
    if (query.dryRun !== undefined) where.dryRun = query.dryRun === 'true';

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder || 'asc' }
      : { createdAt: 'desc' };

    const [data, total] = await this.repository.findBatches({
      skip,
      take: limit,
      where,
      orderBy,
    });
    const totalPages = Math.ceil(total / limit) || 0;

    return {
      data,
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

  async findOne(id: string) {
    const batch = await this.repository.findBatchById(id);
    if (!batch) {
      throw new NotFoundException(`Batch dengan ID ${id} tidak ditemukan`);
    }
    return batch;
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private async fetchReport(query: {
    year?: number;
    houseBlockId?: string;
  }): Promise<any> {
    return null
    // return this.iplPayments.getDelinquentUnits({
    //   year: query.year,
    //   houseBlockId: query.houseBlockId,
    // });
  }

  private buildTargets(report: DelinquentReport): BuiltTarget[] {
    const template = this.config.get<string>('whatsapp.messageTemplate') || null;
    const companyName =
      this.config.get<string>('COMPANY_NAME') || 'Golden Hills Finance';
    const paymentInfo = this.resolvePaymentInfo();

    return report.units.map((unit) => {
      const monthRange = formatMonthRange(
        unit.streakStartMonth,
        unit.asOfMonth,
        report.year,
      );
      const outstandingAmount = (Number(unit.monthlyRate) || 0) * unit.streakCount;
      const ctx: MessageContext = {
        name: unit.residentName,
        unit: unit.unitNumber,
        block: unit.blockName,
        monthRange,
        months: unit.streakCount,
        amount: outstandingAmount,
        paymentInfo,
        companyName,
      };
      return {
        unit,
        monthRange,
        outstandingAmount,
        message: buildMessage(ctx, template),
        phone: normalizeToWaJid(unit.phoneNumber),
      };
    });
  }

  private resolvePaymentInfo(): string {
    const fromConfig = this.config.get<string>('whatsapp.paymentInfo');
    if (fromConfig && fromConfig.trim()) return fromConfig.trim();
    return (
      this.config.get<string>('COMPANY_PHONE') || 'Hubungi kantor paguyuban'
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
