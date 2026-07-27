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
}));

export const getWhatsappConfig = () => whatsappConfig;
