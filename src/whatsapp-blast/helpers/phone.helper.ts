/**
 * Phone-number normalization for WhatsApp (Baileys).
 *
 * Resident phone numbers in the DB are free-text VarChar(20) with no enforced
 * format, so they arrive in mixed forms: "0812xxxx", "+62 812 xxxx", "62-812",
 * "(021) 1234", etc. WhatsApp needs the JID form `62812xxxx@s.whatsapp.net`.
 */

export interface NormalizedPhone {
  valid: boolean;
  /** WhatsApp JID, e.g. `6281234567890@s.whatsapp.net` (null when invalid). */
  jid: string | null;
  /** Digits-only form, e.g. `6281234567890` (null when invalid). */
  normalized: string | null;
  /** Why normalization failed (null when valid). */
  error: string | null;
}

const INVALID = (error: string): NormalizedPhone => ({
  valid: false,
  jid: null,
  normalized: null,
  error,
});

/**
 * Convert any Indonesian phone-number format to a WhatsApp JID.
 * Handles: +62 / 62 / 08xxx / 8xxx (mobile), strips spaces, dashes, dots, parentheses.
 */
export function normalizeToWaJid(
  input: string | null | undefined,
): NormalizedPhone {
  if (!input || !String(input).trim()) {
    return INVALID('Nomor telepon kosong');
  }

  // Strip everything that isn't a digit (keep leading + handled below)
  let digits = String(input).replace(/[\s\-().]/g, '').trim();

  // Normalize country/area prefix to Indonesian country code "62"
  if (digits.startsWith('+62')) {
    digits = '62' + digits.slice(3);
  } else if (digits.startsWith('62')) {
    // already international form
  } else if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    // local mobile without leading 0 → prepend 62
    digits = '62' + digits;
  } else {
    return INVALID('Format nomor tidak dikenali');
  }

  // After prefix normalization it must be all digits
  if (!/^\d+$/.test(digits)) {
    return INVALID('Nomor mengandung karakter non-digit');
  }

  // Sanity length: "62" + 8..13 digits → total 10..15
  if (digits.length < 10 || digits.length > 15) {
    return INVALID('Panjang nomor tidak valid');
  }

  return {
    valid: true,
    jid: `${digits}@s.whatsapp.net`,
    normalized: digits,
    error: null,
  };
}

/** Trimmed/placeholder display form for logs and previews. */
export function formatPhoneDisplay(
  input: string | null | undefined,
): string {
  if (!input || !String(input).trim()) return '-';
  return String(input).trim();
}
