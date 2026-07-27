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
            // emitting a fresh pairing QR.
            this.currentQr = null;
            this.clearAuthState();
            return;
          }
          if (replaced) {
            // Another WA Web session took over — most often our OWN runaway
            // reconnect loop, each new socket replacing the previous one.
            // Reconnecting immediately just replaces it back and sustains a 440
            // flap that risks the number being flagged. Stop and require a
            // manual POST /connect once the competing session is gone.
            return;
          }
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
