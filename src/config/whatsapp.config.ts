import { registerAs } from '@nestjs/config';

/**
 * WhatsApp Blast (Baileys) configuration.
 *
 * Baileys is an unofficial WhatsApp Web client. Settings here control the
 * session lifecycle and — crucially — the sending pace, which keeps the
 * paired number safe from being flagged/banned.
 */
export const whatsappConfig = registerAs('whatsapp', () => ({
  // Auto-connect the WhatsApp session when the app boots.
  enabled: process.env.WHATSAPP_ENABLED === 'true',

  // Folder where Baileys persists the paired session credentials (creds.json,
  // app-state sync files). Treat as sensitive — gitignored.
  authPath: process.env.WHATSAPP_AUTH_PATH || './wa-auth',

  // Delay (ms) between each outbound message during a blast.
  sendDelayMs: parseInt(process.env.WHATSAPP_SEND_DELAY_MS || '2000', 10),

  // How many messages to send at once. 1 = strictly sequential (safest).
  concurrency: Math.max(1, parseInt(process.env.WHATSAPP_CONCURRENCY || '1', 10)),

  // Reconnection attempts on a transient socket disconnect.
  reconnectRetries: parseInt(process.env.WHATSAPP_RECONNECT_RETRIES || '5', 10),

  // Payment instructions / contact line shown in the reminder message.
  // Falls back to COMPANY_PHONE when empty (handled in the message helper).
  paymentInfo: process.env.WHATSAPP_PAYMENT_INFO || '',

  // Optional custom message template overriding the built-in Indonesian one.
  messageTemplate: process.env.WHATSAPP_MESSAGE_TEMPLATE || '',

  // Customer-service bot (incoming-message auto-reply). Opt-in: the socket
  // stays send-only unless this is enabled. The bot only answers personal
  // chats — it never replies in groups.
  bot: {
    enabled: process.env.WHATSAPP_BOT_ENABLED === 'true',
    // How long a resident's conversation state is kept after their last message.
    sessionTtlMs: parseInt(
      process.env.WHATSAPP_BOT_SESSION_TTL_MS || '600000',
      10,
    ),
    // How long the resident & unit caches live before refreshing from the DB.
    residentCacheTtlMs: parseInt(
      process.env.WHATSAPP_BOT_RESIDENT_CACHE_TTL_MS || '300000',
      10,
    ),
    // Verbose trace of EVERY incoming Baileys message event (off by default).
    // Turn on to debug "bot doesn't see my message": it logs the jid (so you
    // can tell personal @s.whatsapp.net vs group @g.us) and fromMe (whether the
    // message came from the paired number itself).
    trace: process.env.WHATSAPP_BOT_TRACE === 'true',

    // User id recorded as `submittedBy` on WhatsApp-originated IPL payments
    // (regular residents have no app account, so a system user attributes them).
    // Provision it via `prisma/scripts/seed-wa-bot-user.ts`. When empty the bot
    // tries to look the user up by username `wa-bot-system` at runtime.
    systemUserId: process.env.WHATSAPP_BOT_SYSTEM_USER_ID || '',
  },
}));

export const getWhatsappConfig = () => whatsappConfig;
