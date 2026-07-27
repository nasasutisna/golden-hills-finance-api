/**
 * Status values for blast batches and individual recipients.
 *
 * Stored as plain VARCHAR (string literals) in the DB to match the project's
 * convention (roles/status elsewhere are also string columns, not Prisma enums).
 */

export const BlastStatus = {
  DRAFT: 'DRAFT',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type BlastStatus = (typeof BlastStatus)[keyof typeof BlastStatus];

export const RecipientStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;
export type RecipientStatus = (typeof RecipientStatus)[keyof typeof RecipientStatus];

export const WhatsAppConnectionState = {
  CLOSED: 'CLOSED',
  CONNECTING: 'CONNECTING',
  QR: 'QR',
  OPEN: 'OPEN',
} as const;
export type WhatsAppConnectionState =
  (typeof WhatsAppConnectionState)[keyof typeof WhatsAppConnectionState];
