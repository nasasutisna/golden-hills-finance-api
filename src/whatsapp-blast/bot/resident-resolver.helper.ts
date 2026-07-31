/**
 * Pure helpers for the WhatsApp CS bot — no Prisma, no I/O, no Baileys types.
 *
 * Kept separate from `WhatsappBotService` so the trickiest logic (identifying a
 * resident from an incoming JID, matching a typed unit code, parsing a Baileys
 * message blob) can be unit-tested without a DB or a live socket. Baileys is
 * imported dynamically in the client service, so its message type isn't even
 * available at compile time here — we treat the message object as `any`.
 */

import { normalizeToWaJid } from '../helpers/phone.helper';

/** Minimal resident shape the bot needs (a subset of the Prisma model). */
export interface ResidentLite {
  id: string;
  firstName: string;
  lastName: string | null;
  phoneNumber: string | null;
  alternatePhone: string | null;
  houseBlockId: string | null;
  houseUnitId: string | null;
  unitNumber: string | null;
  /** App-account link (coordinators have one; regular residents may not). */
  userId: string | null;
}

/** Minimal house-unit shape the bot needs. */
export interface UnitLite {
  id: string;
  unitCode: string;
  unitNumber: string;
  houseBlockId: string;
}

/**
 * Words that (re-)open the main menu from any state. Acts as an escape hatch —
 * a resident stuck mid-flow can always get back to the menu by typing one of
 * these. Kept broad so common greetings land on the menu rather than "unknown".
 */
const MENU_KEYWORDS = [
  'hi', 'hai', 'halo', 'hello', 'admin',
  'menu', 'mulai', 'bantuan', 'start', 'help', 'bantu',
];

/**
 * Extract the digits (local part) from a WhatsApp JID.
 * `6281234567890@s.whatsapp.net` → `6281234567890`.
 *
 * NOTE: with Linked-Identity (LID) senders this returns the sender's LID, NOT
 * their phone number — so it only resolves to a phone for `@s.whatsapp.net`
 * JIDs. LID JIDs must go through the typed-house-code fallback path.
 */
export function jidToDigits(jid: string | null | undefined): string {
  if (!jid) return '';
  const local = String(jid).split('@')[0];
  return local ?? '';
}

/**
 * True when the JID is a 1:1 personal chat the bot may answer.
 *
 * WhatsApp (Baileys v7+) routes personal chats through two JID forms:
 *  - `…@s.whatsapp.net` — the classic phone-number form, and
 *  - `…@lid` — the newer privacy-preserving Linked-Identity form.
 *
 * Group chats (`@g.us`), broadcast, and status JIDs are NOT personal chats and
 * must be rejected so the bot never speaks in groups. Accepting `@lid` here is
 * the fix for "bot never replies" — modern WA delivers personal messages as
 * LID JIDs, and the old `endsWith('@s.whatsapp.net')` guard silently dropped
 * every one of them before it reached the state machine.
 */
export function isPersonalChat(jid: string | null | undefined): boolean {
  if (!jid) return false;
  return jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid');
}

/**
 * Find the first resident whose primary or alternate phone normalizes to the
 * incoming WhatsApp digits. Reuses `normalizeToWaJid` so stored phones in any
 * Indonesian format ("0812…", "+62 812…", "62-812") all match the same JID.
 *
 * Returns `null` when nothing matches — the bot then asks for a house code.
 */
export function matchResidentByPhone(
  residents: ResidentLite[],
  incomingDigits: string,
): ResidentLite | null {
  if (!incomingDigits) return null;
  for (const resident of residents) {
    for (const phone of [resident.phoneNumber, resident.alternatePhone]) {
      if (!phone) continue;
      const norm = normalizeToWaJid(phone);
      if (norm.valid && norm.normalized === incomingDigits) {
        return resident;
      }
    }
  }
  return null;
}

/**
 * Resolve a typed house identifier to a unit, matching `unitCode` first (exact,
 * case-insensitive) then `unitNumber`. Residents type whichever they remember.
 */
export function findUnitByCode(
  units: UnitLite[],
  input: string | null | undefined,
): UnitLite | null {
  if (!input) return null;
  const q = String(input).trim().toUpperCase();
  if (!q) return null;
  return (
    units.find((u) => (u.unitCode ?? '').toUpperCase() === q) ??
    units.find((u) => (u.unitNumber ?? '').toUpperCase() === q) ??
    null
  );
}

/** True when the trimmed, lowercased text is one of the menu keywords. */
export function isMenuKeyword(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = String(text).trim().toLowerCase();
  return !!t && MENU_KEYWORDS.includes(t);
}

/**
 * Pull the plain-text body out of a Baileys message. Handles the common shapes:
 * plain conversation, replied/quoted text, and image/video captions. Media-only
 * messages (no caption) return an empty string.
 */
export function extractText(msg: any): string {
  const m = msg?.message;
  if (!m) return '';
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.videoMessage?.caption ??
    ''
  );
}

/** True when the message carries any media attachment (image, video, doc, …). */
export function hasMedia(msg: any): boolean {
  const m = msg?.message;
  if (!m) return false;
  return Boolean(
    m.imageMessage ||
      m.videoMessage ||
      m.documentMessage ||
      m.audioMessage ||
      m.stickerMessage ||
      m.pttMessage,
  );
}

/** MIME types accepted as a bukti transfer (matches the REST upload filter). */
const PROOF_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
]);

/** True when a downloaded attachment's MIME is an acceptable bukti transfer. */
export function isProofMimeType(mimeType: string | null | undefined): boolean {
  return !!mimeType && PROOF_MIME_TYPES.has(mimeType.toLowerCase());
}

/**
 * Parse the resident's "how many months" answer into a count (1..max), or null
 * when unrecognized. Accepts digits ("1", "3") and the words "semua"/"all"
 * (→ max). Used by the Bayar IPL flow after the outstanding months are listed.
 */
export function parseMonthCount(
  text: string | null | undefined,
  max: number,
): number | null {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (t === 'semua' || t === 'all' || t === 'semuanya') return Math.max(1, max);
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(n, Math.max(1, max));
}

/** True when the unit's block is among the coordinator's blocks. */
export function unitBelongsToBlocks(
  unitHouseBlockId: string | null | undefined,
  blockIds: string[],
): boolean {
  if (!unitHouseBlockId || blockIds.length === 0) return false;
  return blockIds.includes(unitHouseBlockId);
}
