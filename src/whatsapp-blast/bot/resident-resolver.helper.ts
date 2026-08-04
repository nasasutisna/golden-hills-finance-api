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
 * Typo-guard ceiling: the most months a resident may pay in a single bot
 * payment — outstanding tunggakan PLUS advance (di muka) months combined.
 * A resident typing "999" must not silently create a multi-hundred-million
 * IDR pending payment, so counts above this are rejected (re-prompted), not
 * clamped. 60 = 5 years, comfortably above any realistic advance ask.
 */
export const MAX_ADVANCE_MONTHS = 60;

export interface ParseMonthCountOptions {
  /** How many months of tunggakan the unit currently owes (may be 0). */
  outstanding: number;
  /** Hard ceiling on the total months payable (outstanding + advance). */
  maxTotal: number;
}

/**
 * Parse the resident's "how many months" answer into a total count, or null
 * when unrecognized / out of range. Accepts digits ("1", "9", "60") and the
 * words "semua"/"all".
 *
 * Semantics (Bayar IPL / Bayar Iuran Warga advance flow):
 *  - A plain number N = pay N months total, oldest tunggakan first then
 *    continuing into future months. N may EXCEED `outstanding` (that is the
 *    "bayar di muka" case) up to `maxTotal`.
 *  - "semua"/"all" = lunasi seluruh tunggakan only (→ `outstanding`). With
 *    zero tunggakan there is nothing to "semua", so it returns null and the
 *    caller re-prompts for an explicit count.
 *  - N < 1, non-numeric, or N > `maxTotal` → null (the caller re-prompts;
 *    never silently clamped, so the resident sees their typo).
 */
export function parseMonthCount(
  text: string | null | undefined,
  opts: ParseMonthCountOptions,
): number | null {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  if (!t) return null;
  const maxTotal = Math.max(1, opts.maxTotal);
  if (t === 'semua' || t === 'all' || t === 'semuanya') {
    return opts.outstanding > 0 ? Math.min(opts.outstanding, maxTotal) : null;
  }
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  if (n > maxTotal) return null;
  return n;
}

/**
 * True when `text` is a whole number that exceeds `maxTotal` — lets the caller
 * distinguish "you typed too many months" from "I didn't understand that" when
 * {@link parseMonthCount} returns null, so the re-prompt can be specific.
 */
export function isMonthCountOverCap(
  text: string | null | undefined,
  maxTotal: number,
): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!/^\d+$/.test(t)) return false;
  return parseInt(t, 10) > maxTotal;
}

/**
 * Enumerate `count` consecutive future month/year slots starting the month
 * AFTER `{afterMonth, afterYear}`, rolling Dec(12) → Jan(1) of the next year.
 * Pure (no I/O) so it is trivially unit-testable; the service resolves period
 * ids around the slots it returns.
 *
 * Uses JS Date arithmetic: `new Date(year, monthIndex, 1)` normalizes overflow,
 * so passing a 0-based `monthIndex = afterMonth + i - 1` yields the correct
 * rolled-over month/year for any input (e.g. afterMonth=12, i=1 → Jan year+1).
 */
export function computeFutureMonthSlots(
  afterMonth: number,
  afterYear: number,
  count: number,
): { month: number; year: number }[] {
  if (count <= 0) return [];
  const slots: { month: number; year: number }[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(afterYear, afterMonth + i - 1, 1);
    slots.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return slots;
}

/** True when the unit's block is among the coordinator's blocks. */
export function unitBelongsToBlocks(
  unitHouseBlockId: string | null | undefined,
  blockIds: string[],
): boolean {
  if (!unitHouseBlockId || blockIds.length === 0) return false;
  return blockIds.includes(unitHouseBlockId);
}
