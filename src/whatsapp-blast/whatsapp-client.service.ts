import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WASocket } from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
// Namespace import: `qrcode` is CommonJS and the project does not enable
// esModuleInterop, so a default import compiles to `qrcode_1.default.toDataURL`
// where `.default` is undefined — silently turning the QR data URL into null
// (the try/catch below would swallow the TypeError). `import * as` binds the
// module object directly so `QRCode.toDataURL` resolves at runtime.
import * as QRCode from 'qrcode';
import { WhatsAppConnectionState } from './dto/enums';

/** Map a MIME type to a lowercase extension (with leading dot); unknown → '.bin'. */
function mimeTypeToExt(mimeType: string | null | undefined): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
  };
  const ext = mimeType ? map[mimeType.toLowerCase()] : undefined;
  return ext || '.bin';
}

/**
 * Singleton wrapper around a Baileys WhatsApp Web socket.
 *
 * Baileys is published as ESM; this project is CommonJS, so we load it with a
 * dynamic `import()` inside `connect()` to avoid breaking the TS build.
 *
 * One instance = one paired WhatsApp number. The socket lives for the lifetime
 * of the app; QR pairing happens once (credentials persist in `whatsapp.authPath`).
 */
@Injectable()
export class WhatsappClientService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappClientService.name);
  /** Active socket (null until first connect). */
  private sock: WASocket | null = null;
  /** Current credentials save handler (re-bound on each connect). */
  private saveCreds: (() => Promise<void>) | null = null;
  /** Latest pairing QR string (null when none / already paired). */
  private currentQr: string | null = null;
  private connectionState: WhatsAppConnectionState =
    WhatsAppConnectionState.CLOSED;
  /** JID of the paired number, e.g. 62812xxxx@s.whatsapp.net (null until OPEN). */
  private ownJid: string | null = null;
  /** Guards against runaway reconnect loops. */
  private reconnectAttempts = 0;
  /**
   * Only resets `reconnectAttempts` once the socket has stayed OPEN for the
   * grace period. A sub-second OPEN that immediately gets replaced must NOT
   * reset the budget, or a flap never converges and reconnects forever.
   */
  private stableOpenTimer: NodeJS.Timeout | null = null;
  /** Prevents overlapping connect() calls. */
  private connecting = false;
  /**
   * Incoming-message handler registered by the CS bot (see WhatsappBotService).
   * Null when no bot is wired — the `messages.upsert` listener below reads this
   * live, so registration order vs. connect() doesn't matter and reconnects
   * re-attach automatically.
   */
  private messageHandler:
    | ((payload: { messages: any[]; type: string }) => void | Promise<void>)
    | null = null;
  /**
   * Verbose trace of every `messages.upsert` event at the socket level — fires
   * even before the handler is checked, so it can distinguish "Baileys isn't
   * delivering the message" from "the handler isn't registered". Controlled by
   * `whatsapp.bot.trace`.
   */
  private messageTrace = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.config.get<boolean>('whatsapp.enabled');
    if (enabled) {
      // Fire and forget — don't block app startup on WhatsApp pairing.
      this.connect().catch((err) =>
        this.logger.error(
          `Initial WhatsApp connect failed: ${err?.message ?? err}`,
        ),
      );
    } else {
      this.logger.log('WhatsApp auto-connect disabled (WHATSAPP_ENABLED=false).');
    }
  }

  isConnected(): boolean {
    return (
      this.connectionState === WhatsAppConnectionState.OPEN && !!this.sock
    );
  }

  /**
   * Register the incoming-message handler (the CS bot). Call once on app boot;
   * the handler is invoked from the `messages.upsert` listener for every new
   * personal message. Errors thrown by the handler are logged here so a bad
   * message can never tear down the socket.
   */
  registerMessageHandler(
    handler: (payload: { messages: any[]; type: string }) => void | Promise<void>,
  ): void {
    this.messageHandler = handler;
  }

  getState(): WhatsAppConnectionState {
    return this.connectionState;
  }

  /**
   * Snapshot of connection state plus the pairing QR (rendered as a data URL)
   * when pairing is pending. Used by the `GET /status` endpoint.
   */
  async getStatus(): Promise<{
    state: WhatsAppConnectionState;
    connected: boolean;
    phoneNumber: string | null;
    hasQr: boolean;
    qrDataUrl: string | null;
  }> {
    let qrDataUrl: string | null = null;
    if (this.currentQr) {
      try {
        qrDataUrl = await QRCode.toDataURL(this.currentQr, { margin: 1 });
      } catch {
        qrDataUrl = null;
      }
    }
    return {
      state: this.connectionState,
      connected: this.isConnected(),
      phoneNumber: this.ownJid?.split('@')[0] ?? null,
      hasQr: !!this.currentQr,
      qrDataUrl,
    };
  }

  /**
   * Open (or re-open) the WhatsApp socket. Idempotent: if already connecting or
   * open, returns the current state without spinning up a second socket.
   */
  async connect(): Promise<{ state: WhatsAppConnectionState }> {
    if (this.connecting || this.isConnected()) {
      return { state: this.connectionState };
    }
    this.connecting = true;

    try {
      const authPath = this.config.get<string>('whatsapp.authPath') || './wa-auth';
      const absAuthPath = path.resolve(process.cwd(), authPath);
      this.messageTrace = this.config.get<boolean>('whatsapp.bot.trace') ?? false;
      if (!fs.existsSync(absAuthPath)) {
        fs.mkdirSync(absAuthPath, { recursive: true });
      }

      // Dynamic import — Baileys is ESM.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Baileys: any = await import('@whiskeysockets/baileys');
      const makeWASocket = Baileys.default ?? Baileys.makeWASocket;
      const { state, saveCreds } = await Baileys.useMultiFileAuthState(absAuthPath);
      const { version } = await Baileys.fetchLatestBaileysVersion();
      const DisconnectReason = Baileys.DisconnectReason;

      this.saveCreds = saveCreds;
      this.connectionState = WhatsAppConnectionState.CONNECTING;

      const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['GoldenHillsFinance', 'Chrome', '1.0.0'],
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });
      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      // Incoming messages → the CS bot (if one is registered). Read live so a
      // handler registered after connect() still works, and reconnects re-bind.
      sock.ev.on('messages.upsert', async (payload: any) => {
        // Socket-level trace fires before the handler check, so it proves
        // whether Baileys is delivering the message at all.
        if (this.messageTrace) {
          const j = payload?.messages?.[0]?.key?.remoteJid ?? '(none)';
          this.logger.log(
            `[wa-client-trace] messages.upsert type=${payload?.type} jid=${j} handlerRegistered=${!!this.messageHandler}`,
          );
        }
        if (!this.messageHandler) return;
        try {
          await this.messageHandler(payload);
        } catch (err: any) {
          this.logger.error(
            `Incoming-message handler error: ${err?.message ?? err}`,
          );
        }
      });

      sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
          this.currentQr = qr;
          this.connectionState = WhatsAppConnectionState.QR;
          this.logger.warn('WhatsApp pairing QR ready — scan via GET /status.');
        }
        if (connection === 'connecting') {
          this.connectionState = WhatsAppConnectionState.CONNECTING;
        }
        if (connection === 'open') {
          this.currentQr = null;
          this.connectionState = WhatsAppConnectionState.OPEN;
          this.ownJid = sock.user?.id ?? null;
          // Only credit a *stable* recovery after surviving the grace period —
          // a flash-OPEN that gets replaced a moment later must not reset the
          // reconnect budget, or a 440 flap loops forever.
          this.armStableOpenTimer();
          this.logger.log(
            `WhatsApp connected as ${this.ownJid ?? '(unknown number)'}.`,
          );
        }
        if (connection === 'close') {
          this.sock = null;
          this.connectionState = WhatsAppConnectionState.CLOSED;
          this.clearStableOpenTimer();
          const code = lastDisconnect?.error?.output?.statusCode;
          const loggedOut = code === DisconnectReason?.loggedOut;
          const badSession = code === DisconnectReason?.badSession; // 500
          const replaced = code === DisconnectReason?.connectionReplaced; // 440
          this.logger.warn(
            `WhatsApp closed (code=${code ?? 'n/a'}${loggedOut ? ', logged out' : ''}${badSession ? ', bad session' : ''}${replaced ? ', session replaced' : ''}).`,
          );
          if (loggedOut || badSession) {
            // Session invalidated server-side. Wipe the persisted creds —
            // otherwise useMultiFileAuthState reloads the dead session on the
            // next connect() and Baileys tries to restore it instead of
            // emitting a fresh pairing QR. These cannot be recovered without a
            // fresh QR, so do NOT auto-reconnect.
            this.currentQr = null;
            this.clearAuthState();
            return;
          }
          // Everything else — including 440 (connectionReplaced) and transient
          // drops — auto-reconnects with bounded exponential backoff. A genuine
          // competing session will 440 back, but scheduleReconnect caps attempts
          // (whatsapp.reconnectRetries) and only resets its budget after a stable
          // OPEN, so the flap converges (a few tries, then stop) instead of
          // looping forever and risking the number being flagged. connect() is
          // idempotent, so this is safe even if a manual /connect races in.
          void this.scheduleReconnect();
        }
      });

      return { state: this.connectionState };
    } catch (err: any) {
      this.connectionState = WhatsAppConnectionState.CLOSED;
      this.logger.error(`WhatsApp connect error: ${err?.message ?? err}`);
      throw err;
    } finally {
      this.connecting = false;
    }
  }

  /** Disconnect and discard the in-memory socket (keeps persisted creds). */
  async disconnect(): Promise<{ state: WhatsAppConnectionState }> {
    try {
      this.sock?.end(new Error('Manual disconnect'));
    } catch {
      /* ignore */
    }
    this.sock = null;
    this.currentQr = null;
    this.ownJid = null;
    this.connectionState = WhatsAppConnectionState.CLOSED;
    this.clearStableOpenTimer();
    this.logger.log('WhatsApp disconnected.');
    return { state: this.connectionState };
  }

  /**
   * Switch the paired admin number: close the socket, wipe the persisted
   * credentials, and open a fresh connection that emits a new pairing QR. The
   * previously paired number is logged out of this app. Powers the "Ganti
   * Nomor / Reset Pairing" button — no need to delete `wa-auth/` by hand.
   */
  async resetPairing(): Promise<{ state: WhatsAppConnectionState }> {
    await this.disconnect();
    this.clearAuthState();
    // Ensure the connect() guard lets the fresh connection through even if a
    // previous connect was still in flight.
    this.connecting = false;
    this.ownJid = null;
    this.currentQr = null;
    this.logger.warn(
      'WhatsApp pairing reset — a fresh QR will be issued. Scan with the new number.',
    );
    return this.connect();
  }

  /**
   * Send a text message. Throws on failure so the caller can mark the recipient
   * as FAILED and capture the error message.
   */
  async sendText(jid: string, text: string): Promise<{ messageId: string }> {
    if (!this.isConnected() || !this.sock) {
      throw new Error('WhatsApp belum terhubung. Lakukan pairing QR terlebih dahulu.');
    }
    const result = await this.sock.sendMessage(jid, { text });
    const messageId =
      result?.key?.id ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    return { messageId };
  }

  /**
   * Send a file (e.g. the IPL Kwitansi PDF) with an optional caption. `filePath`
   * is a path Baileys can read (pass an absolute disk path for reliability);
   * it is streamed via `{ url }`.
   */
  async sendDocument(
    jid: string,
    input: {
      filePath: string;
      fileName: string;
      mimetype?: string;
      caption?: string;
    },
  ): Promise<{ messageId: string }> {
    if (!this.isConnected() || !this.sock) {
      throw new Error('WhatsApp belum terhubung. Lakukan pairing QR terlebih dahulu.');
    }
    const result = await this.sock.sendMessage(jid, {
      document: { url: input.filePath },
      fileName: input.fileName,
      mimetype: input.mimetype,
      caption: input.caption,
    } as any);
    const messageId =
      result?.key?.id ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    return { messageId };
  }

  /**
   * Download an incoming media attachment (image/document) to a buffer. Used by
   * the bot to capture a resident's bukti transfer. Returns null when the
   * message has no decryptable media. `downloadMediaMessage` is loaded the same
   * dynamic-import way as the socket (Baileys is ESM).
   */
  async downloadMedia(
    msg: any,
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> {
    if (!this.isConnected() || !this.sock) {
      throw new Error('WhatsApp belum terhubung. Lakukan pairing QR terlebih dahulu.');
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Baileys: any = await import('@whiskeysockets/baileys');
    const downloadMediaMessage = Baileys.downloadMediaMessage;
    if (typeof downloadMediaMessage !== 'function') return null;

    const result: any = await downloadMediaMessage(msg, 'buffer', {});
    if (!result) return null;
    const buffer = Buffer.isBuffer(result) ? result : Buffer.from(result as Uint8Array);
    const { mimeType, fileName } = this.describeMedia(msg);
    return { buffer, mimeType, fileName };
  }

  /**
   * Resolve a Linked-Identity (`@lid`) JID to the classic phone-number JID
   * (`@s.whatsapp.net`) using Baileys' internal LID↔PN mapping (learned from
   * app-state sync / signal sessions). Returns null when the mapping isn't
   * known yet — the bot then falls back to the typed-unit-code path.
   *
   * `signalRepository` isn't on the public WASocket type, hence the cast; it is
   * the same object Baileys itself uses internally for LID resolution.
   */
  async resolveLidToPhoneJid(lidJid: string): Promise<string | null> {
    if (!this.sock) return null;
    try {
      const repo: any = (this.sock as any).signalRepository;
      const pn = await repo?.lidMapping?.getPNForLID?.(lidJid);
      return typeof pn === 'string' && pn ? pn : null;
    } catch (err: any) {
      this.logger.debug(
        `getPNForLID failed for ${lidJid}: ${err?.message ?? err}`,
      );
      return null;
    }
  }

  /**
   * Resolve phone-number JIDs to their Linked-Identity (`@lid`) JIDs in one
   * batched call. Unlike the reverse direction (`getPNForLID`, cache-only), the
   * phone→LID lookup (`getLIDForPN`) is fetched from WhatsApp's usync on demand,
   * so it works even for contacts the bot has never mapped before. The bot uses
   * this to build a LID→resident map so incoming `@lid` messages identify.
   * Returns `{ pn, lid }` pairs (pn = phone JID, lid = LID JID).
   */
  async resolvePhoneJidsToLids(
    phoneJids: string[],
  ): Promise<{ pn: string; lid: string }[]> {
    if (!this.sock || phoneJids.length === 0) return [];
    try {
      const repo: any = (this.sock as any).signalRepository;
      const result = await repo?.lidMapping?.getLIDsForPNs?.(phoneJids);
      if (!Array.isArray(result)) return [];
      return result
        .filter((r: any) => r?.pn && r?.lid)
        .map((r: any) => ({ pn: r.pn, lid: r.lid }));
    } catch (err: any) {
      this.logger.debug(`getLIDsForPNs failed: ${err?.message ?? err}`);
      return [];
    }
  }

  /** Extract mimetype + a fallback filename from a Baileys media message. */
  private describeMedia(msg: any): { mimeType: string; fileName: string } {
    const m = msg?.message;
    if (!m) return { mimeType: '', fileName: '' };
    const image = m.imageMessage;
    const document = m.documentMessage;
    const video = m.videoMessage;
    const sticker = m.stickerMessage;
    const mimeType: string =
      image?.mimetype || document?.mimetype || video?.mimetype || sticker?.mimetype || '';
    let fileName: string = document?.fileName || '';
    if (!fileName) {
      const ext = mimeTypeToExt(mimeType);
      fileName = `bukti${ext}`;
    }
    return { mimeType, fileName };
  }

  /**
   * Start the stable-OPEN grace timer (10s). If the socket is still OPEN when
   * it fires, the reconnect budget is reset — confirming a genuine recovery.
   */
  private armStableOpenTimer(): void {
    this.clearStableOpenTimer();
    this.stableOpenTimer = setTimeout(() => {
      this.stableOpenTimer = null;
      if (this.connectionState === WhatsAppConnectionState.OPEN) {
        this.reconnectAttempts = 0;
      }
    }, 10_000);
  }

  private clearStableOpenTimer(): void {
    if (this.stableOpenTimer) {
      clearTimeout(this.stableOpenTimer);
      this.stableOpenTimer = null;
    }
  }

  /**
   * Wipe persisted credentials so the next connect() is a fresh pairing that
   * emits a QR. Called when the session is invalidated server-side (loggedOut,
   * badSession) — otherwise Baileys keeps trying to restore the dead session
   * instead of generating a new QR.
   */
  private clearAuthState(): void {
    const authPath = this.config.get<string>('whatsapp.authPath') || './wa-auth';
    const absAuthPath = path.resolve(process.cwd(), authPath);
    try {
      fs.rmSync(absAuthPath, { recursive: true, force: true });
      this.logger.warn(
        `Cleared stale WhatsApp auth state (${absAuthPath}) — re-pair via POST /connect.`,
      );
    } catch (err: any) {
      this.logger.error(`Failed to clear auth state: ${err?.message ?? err}`);
    }
  }

  /** Exponential-backoff reconnect with a hard cap from config. */
  private async scheduleReconnect(): Promise<void> {
    const max = this.config.get<number>('whatsapp.reconnectRetries') ?? 5;
    if (this.reconnectAttempts >= max) {
      this.logger.error(
        `Gave up reconnecting after ${max} attempts. Call POST /whatsapp-blast/connect to retry.`,
      );
      return;
    }
    this.reconnectAttempts += 1;
    const delay = Math.min(2000 * 2 ** (this.reconnectAttempts - 1), 30000);
    this.logger.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${max})...`,
    );
    await sleep(delay);
    await this.connect().catch((err) =>
      this.logger.error(`Reconnect failed: ${err?.message ?? err}`),
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
