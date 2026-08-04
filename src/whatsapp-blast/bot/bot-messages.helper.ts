/**
 * Text builders for the WhatsApp CS bot.
 *
 * Pure functions that format the bot's replies. Currency formatting mirrors the
 * blast template helper (`Intl.NumberFormat('id-ID', currency IDR)`), and the
 * month-range label reuses the delinquent-units helper so bot and blast always
 * describe the same period the same way.
 */

import {
  formatMonthRange,
  formatMonthRangeCrossYear,
} from '../../ipl-payments/helpers/delinquent-units.helper';

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format an IDR amount; non-finite / non-positive → "Rp0". */
export function formatIdr(amount: number): string {
  return Number.isFinite(amount) && amount > 0
    ? idrFormatter.format(amount)
    : idrFormatter.format(0);
}

/** Re-exported for the service so it has a single import surface. */
export { formatMonthRange, formatMonthRangeCrossYear };

/** Context for the outstanding-IPL reply. */
export interface IplOutstandingContext {
  name: string | null;
  unit: string | null;
  block: string | null;
  /** e.g. "Mei – Juli 2026" — pass through from `formatMonthRange`. */
  monthRange: string;
  months: number;
  amount: number;
  paymentInfo: string;
  companyName: string;
}

/** The main menu. Numbers double as the accepted choice tokens. */
export function buildMenuText(): string {
  return [
    '👋 *Layanan Otomatis Paguyuban*',
    '',
    'Silakan balas dengan angka:',
    '',
    '1️⃣ Cek Tagihan IPL',
    '2️⃣ Bayar IPL',
    '3️⃣ Cek Iuran Warga',
    '4️⃣ Bayar Iuran Warga',
    '0️⃣ Bicara dengan Admin',
    '',
    '_Ketik *menu* kapan saja untuk kembali ke sini._',
  ].join('\n');
}

/** Outstanding-IPL summary — mirrors the blast message in tone and facts. */
export function buildIplOutstandingText(ctx: IplOutstandingContext): string {
  const name = ctx.name?.trim() || 'Bapak/Ibu';
  const unit = ctx.unit?.trim() || '-';
  const blockSuffix = ctx.block ? ` — ${ctx.block}` : '';
  return [
    `Yth. ${name}`,
    `Unit ${unit}${blockSuffix}`,
    '',
    `Berdasarkan catatan kami terdapat tunggakan Iuran Pemeliharaan Lingkungan (IPL) untuk periode ${ctx.monthRange} (${ctx.months} bulan), dengan total *${formatIdr(ctx.amount)}*.`,
    '',
    'Mohon dapat segera dilunasi. Untuk informasi pembayaran:',
    ctx.paymentInfo || '-',
    '',
    `Terima kasih. — ${ctx.companyName}`,
  ].join('\n');
}

/** Sent when the identified unit has no trailing delinquency this year. */
export function buildNoOutstandingText(name: string | null, year: number): string {
  const greeting = name?.trim() ? `Yth. ${name.trim()}` : 'Yth. Bapak/Ibu';
  return [
    `${greeting},`,
    '',
    `✅ Tidak ada tunggakan IPL yang tercatat untuk unit Anda pada tahun ${year}.`,
    '',
    'Terima kasih telah selalu tepat waktu. 🙏',
    '',
    '_Ketik *menu* untuk kembali._',
  ].join('\n');
}

/** Asks the resident for their house code (fallback path). */
export function buildAskUnitCodeText(): string {
  return [
    'Mohon maaf, nomor Anda belum kami kenali. 🙏',
    '',
    'Balas dengan *kode rumah* Anda agar kami bisa cek tagihan.',
    'Contoh: *A1-12* atau *B2-05*.',
    '',
    '_Ketik *menu* untuk membatalkan._',
  ].join('\n');
}

/** Sent when a typed house code matches no unit. */
export function buildUnitNotFoundText(): string {
  return [
    '⚠️ Kode rumah tidak ditemukan.',
    '',
    'Silakan periksa kembali dan ketik ulang, atau ketik *menu*.',
  ].join('\n');
}

/** Acknowledges an incoming media message (proof of payment, etc.). */
export function buildMediaAckText(): string {
  return [
    '✅ Terima kasih, dokumen/foto Anda telah kami terima.',
    '',
    'Bukti pembayaran akan diverifikasi oleh admin dalam 1×24 jam.',
    '',
    '_Ketik *menu* untuk kembali._',
  ].join('\n');
}

/** Hand-off reply when the resident asks to speak to a human. */
export function buildAdminHandoffText(): string {
  return [
    '👨‍💼 Pesan Anda akan diteruskan ke admin.',
    '',
    'Admin kami akan menghubungi Anda segera. Mohon ditunggu ya. 🙏',
  ].join('\n');
}

/** Friendly reply for an unrecognized menu choice, followed by re-showing options. */
export function buildUnknownChoiceText(): string {
  return [
    'Maaf, pilihan tidak dikenal.',
    '',
    'Silakan balas:',
    '1️⃣ Cek Tagihan IPL',
    '2️⃣ Bayar IPL',
    '3️⃣ Cek Iuran Warga',
    '4️⃣ Bayar Iuran Warga',
    '0️⃣ Bicara dengan Admin',
  ].join('\n');
}

/** Friendly reply when the data lookup itself fails. */
export function buildTemporarilyUnavailableText(): string {
  return [
    'Maaf, layanan sedang tidak tersedia sejenak. 😔',
    '',
    'Silakan coba beberapa saat lagi atau ketik *0* untuk bicara dengan admin.',
  ].join('\n');
}

// ------------------------------------------------------------------
// Bayar IPL flow
// ------------------------------------------------------------------

/** The resident's WhatsApp number isn't linked to any resident record. */
export function buildPayUnregisteredText(): string {
  return [
    'Mohon maaf, nomor WhatsApp Anda belum terdaftar. 🙏',
    '',
    'Pembayaran IPL via bot hanya untuk nomor yang sudah terdaftar.',
    'Silakan hubungi admin untuk pendaftaran, atau ketik *0*.',
  ].join('\n');
}

/** The matched resident has no house unit on file. */
export function buildPayNoUnitText(): string {
  return [
    'Mohon maaf, unit rumah Anda belum tercatat di sistem. 🙏',
    '',
    'Silakan hubungi admin agar unit Anda diperbarui, atau ketik *0*.',
  ].join('\n');
}

/** Coordinator path: ask which unit in their block they want to pay for. */
export function buildAskPayUnitText(blockLabel: string): string {
  return [
    `Anda terdaftar sebagai *koordinator${blockLabel ? ` ${blockLabel}` : ''}*.`,
    '',
    'Ketik *kode unit* rumah yang ingin dibayarkan (contoh: *A1-12*).',
    '',
    '_Ketik *menu* untuk membatalkan._',
  ].join('\n');
}

/** Typed unit is real but outside the coordinator's block(s). */
export function buildPayUnitOutsideBlockText(): string {
  return [
    '⚠️ Unit tersebut berada di luar blok yang Anda koordinasi.',
    '',
    'Silakan ketik kode unit lain, atau ketik *menu*.',
  ].join('\n');
}

/** Typed unit code didn't match anything. */
export function buildPayUnitNotFoundText(): string {
  return [
    '⚠️ Kode unit tidak ditemukan.',
    '',
    'Silakan periksa kembali dan ketik ulang, atau ketik *menu*.',
  ].join('\n');
}

export interface PaySummaryContext {
  name: string | null;
  unit: string | null;
  block: string | null;
  /** e.g. "Mei – Juli 2026"; null when the unit has no tunggakan (advance-only). */
  monthRangeLabel: string | null;
  /** Months of tunggakan currently owed (0 = lunas → advance-only prompt). */
  outstandingCount: number;
  monthlyRate: number;
  /** Total tunggakan amount (outstandingCount × monthlyRate). */
  totalAmount: number;
  paymentInfo: string;
  /** Hard cap on total months payable in one shot (outstanding + advance). */
  advanceCap: number;
}

/**
 * Outstanding summary + "how many months" prompt. Supports paying AHEAD (bayar
 * di muka): the resident may type a number larger than `outstandingCount` (up to
 * `advanceCap`) to also cover future months. With zero tunggakan the prompt
 * switches to a pure advance offer instead of a dead-end.
 */
export function buildPaySummaryText(ctx: PaySummaryContext): string {
  const name = ctx.name?.trim() || 'Bapak/Ibu';
  const unit = ctx.unit?.trim() || '-';
  const blockSuffix = ctx.block ? ` — ${ctx.block}` : '';
  const cap = ctx.advanceCap;
  const lines = [
    `Yth. ${name}`,
    `Unit ${unit}${blockSuffix}`,
    '',
    `Tarif per bulan: ${formatIdr(ctx.monthlyRate)}`,
  ];
  if (ctx.outstandingCount > 0 && ctx.monthRangeLabel) {
    lines.push(
      `Tunggakan IPL: ${ctx.monthRangeLabel} (${ctx.outstandingCount} bulan) — *${formatIdr(ctx.totalAmount)}*`,
    );
    lines.push('');
    lines.push(
      `Mau bayar berapa bulan? Balas angka *1–${cap}* ` +
      `(boleh lebih dari ${ctx.outstandingCount} untuk *bayar di muka*), atau *semua* (lunasi tunggakan).`,
    );
  } else {
    lines.push('');
    lines.push('✅ Tidak ada tunggakan IPL. Mau *bayar di muka*?');
    lines.push(`Balas angka *1–${cap}* jumlah bulan yang ingin dibayar di muka.`);
  }
  lines.push('', '_Ketik *menu* untuk membatalkan._');
  return lines.join('\n');
}

/** "How many months" answer wasn't acceptable. `reason` tailors the message. */
export function buildPayMonthChoiceInvalidText(
  max: number,
  reason?: 'invalid' | 'over-cap',
): string {
  if (reason === 'over-cap') {
    return [
      '⚠️ Angka terlalu besar.',
      '',
      `Maksimal *${max} bulan* sekali bayar (tunggakan + bayar di muka).`,
      'Silakan ketik angka yang lebih kecil, atau *semua* (lunasi tunggakan).',
    ].join('\n');
  }
  return [
    'Mohon balas dengan angka yang valid.',
    '',
    `Contoh: *1* sampai *${max}* (boleh lebih dari jumlah tunggakan untuk bayar di muka), atau *semua*.`,
  ].join('\n');
}

/** Months chosen — now show the total + where to transfer, then ask for proof. */
export function buildPayProofPromptText(ctx: {
  monthRangeLabel: string;
  monthCount: number;
  totalAmount: number;
  paymentInfo: string;
  /** Future (bayar di muka) months included in this payment, if any. */
  advanceMonths?: number;
}): string {
  const lines = [
    `Anda akan membayar IPL ${ctx.monthRangeLabel} (${ctx.monthCount} bulan).`,
  ];
  if (ctx.advanceMonths && ctx.advanceMonths > 0) {
    lines.push(`_(termasuk ${ctx.advanceMonths} bulan di muka)_`);
  }
  lines.push(
    `Total: *${formatIdr(ctx.totalAmount)}*`,
    '',
    'Silakan transfer ke:',
    ctx.paymentInfo || '-',
    '',
    'Setelah transfer, balas pesan ini dengan *foto/screenshot bukti transfer* (gambar/PDF).',
    '',
    '_Ketik *menu* untuk membatalkan._',
  );
  return lines.join('\n');
}

/** Proof step received text instead of media. */
export function buildPayProofAwaitingText(): string {
  return [
    'Mohon kirim *foto/screenshot bukti transfer* (gambar atau PDF).',
    '',
    '_Ketik *menu* untuk membatalkan._',
  ].join('\n');
}

/** Proof file type not accepted. */
export function buildPayProofUnsupportedText(): string {
  return [
    '⚠️ Format tidak didukung.',
    '',
    'Mohon kirim bukti transfer berupa *gambar (JPG/PNG)* atau *PDF*.',
  ].join('\n');
}

/** Payment created as PENDING. */
export function buildPayReceivedText(referenceNumber: string): string {
  return [
    '✅ *Pembayaran Anda telah kami terima.*',
    '',
    `Nomor referensi: *${referenceNumber}*`,
    'Status: *MENUNGGU VERIFIKASI* (admin memverifikasi bukti transfer).',
    '',
    'Kwitansi (PDF) akan dikirim otomatis setelah pembayaran disetujui.',
    '',
    'Terima kasih. 🙏',
    '',
    '_Ketik *menu* untuk kembali._',
  ].join('\n');
}

/** A duplicate — one of the chosen months is already paid/pending. */
export function buildPayDuplicateText(): string {
  return [
    '⚠️ Pembayaran untuk bulan terpilih sudah ada di sistem.',
    '',
    'Silakan ketik *menu* lalu *2* untuk memulai ulang, atau hubungi admin.',
  ].join('\n');
}

/** Could not attribute the payment (no system/resident user to record as submitter). */
export function buildPayCannotAttributeText(): string {
  return [
    'Mohon maaf, pembayaran belum dapat diproses otomatis. 🙏',
    '',
    'Silakan hubungi admin (ketik *0*) atau coba beberapa saat lagi.',
  ].join('\n');
}

/** Generic failure creating the payment. */
export function buildPayFailedText(): string {
  return [
    'Mohon maaf, terjadi kendala saat memproses pembayaran. 😔',
    '',
    'Silakan coba lagi nanti atau ketik *0* untuk bicara dengan admin.',
  ].join('\n');
}

// ------------------------------------------------------------------
// Approval notifications (pushed on admin approve/reject)
// ------------------------------------------------------------------

/** Pushed to the resident when their IPL payment is approved. */
export function buildPayApprovedText(
  name: string | null,
  referenceNumber: string,
): string {
  const greeting = name?.trim() ? `Yth. ${name.trim()}` : 'Yth. Bapak/Ibu';
  return [
    `${greeting},`,
    '',
    '✅ *Pembayaran IPL Anda telah disetujui.*',
    '',
    `Nomor referensi: *${referenceNumber}*`,
    'Kwitansi (PDF) terlampir. Terima kasih. 🙏',
  ].join('\n');
}

/** Pushed to the resident when their IPL payment is rejected. */
export function buildPayRejectedText(
  name: string | null,
  referenceNumber: string,
  reason: string | null,
): string {
  const greeting = name?.trim() ? `Yth. ${name.trim()}` : 'Yth. Bapak/Ibu';
  const lines = [
    `${greeting},`,
    '',
    '❌ *Mohon maaf, pembayaran IPL Anda belum dapat diverifikasi.*',
    '',
    `Nomor referensi: *${referenceNumber}*`,
  ];
  if (reason?.trim()) {
    lines.push(`Alasan: ${reason.trim()}`);
  }
  lines.push('', 'Silakan hubungi admin (ketik *0*) untuk informasi lebih lanjut.');
  return lines.join('\n');
}

// ------------------------------------------------------------------
// Iuran Warga flows (mirror the IPL builders; only the labels differ)
// ------------------------------------------------------------------

/** Outstanding-Iuran-Warga summary — mirrors `buildIplOutstandingText`. */
export function buildIuranOutstandingText(ctx: IplOutstandingContext): string {
  const name = ctx.name?.trim() || 'Bapak/Ibu';
  const unit = ctx.unit?.trim() || '-';
  const blockSuffix = ctx.block ? ` — ${ctx.block}` : '';
  return [
    `Yth. ${name}`,
    `Unit ${unit}${blockSuffix}`,
    '',
    `Berdasarkan catatan kami terdapat tunggakan Iuran Warga untuk periode ${ctx.monthRange} (${ctx.months} bulan), dengan total *${formatIdr(ctx.amount)}*.`,
    '',
    'Mohon dapat segera dilunasi. Untuk informasi pembayaran:',
    ctx.paymentInfo || '-',
    '',
    `Terima kasih. — ${ctx.companyName}`,
  ].join('\n');
}

/** Sent when the identified unit has no trailing iuran delinquency this year. */
export function buildNoIuranOutstandingText(name: string | null, year: number): string {
  const greeting = name?.trim() ? `Yth. ${name.trim()}` : 'Yth. Bapak/Ibu';
  return [
    `${greeting},`,
    '',
    `✅ Tidak ada tunggakan Iuran Warga yang tercatat untuk unit Anda pada tahun ${year}.`,
    '',
    'Terima kasih telah selalu tepat waktu. 🙏',
    '',
    '_Ketik *menu* untuk kembali._',
  ].join('\n');
}

/** Lists the outstanding iuran months / advance offer, asks how many to pay. */
export function buildIuranPaySummaryText(ctx: PaySummaryContext): string {
  const name = ctx.name?.trim() || 'Bapak/Ibu';
  const unit = ctx.unit?.trim() || '-';
  const blockSuffix = ctx.block ? ` — ${ctx.block}` : '';
  const cap = ctx.advanceCap;
  const lines = [
    `Yth. ${name}`,
    `Unit ${unit}${blockSuffix}`,
    '',
    `Tarif per bulan: ${formatIdr(ctx.monthlyRate)}`,
  ];
  if (ctx.outstandingCount > 0 && ctx.monthRangeLabel) {
    lines.push(
      `Tunggakan Iuran Warga: ${ctx.monthRangeLabel} (${ctx.outstandingCount} bulan) — *${formatIdr(ctx.totalAmount)}*`,
    );
    lines.push('');
    lines.push(
      `Mau bayar berapa bulan? Balas angka *1–${cap}* ` +
      `(boleh lebih dari ${ctx.outstandingCount} untuk *bayar di muka*), atau *semua* (lunasi tunggakan).`,
    );
  } else {
    lines.push('');
    lines.push('✅ Tidak ada tunggakan Iuran Warga. Mau *bayar di muka*?');
    lines.push(`Balas angka *1–${cap}* jumlah bulan yang ingin dibayar di muka.`);
  }
  lines.push('', '_Ketik *menu* untuk membatalkan._');
  return lines.join('\n');
}

/** Months chosen — now show the total + where to transfer, then ask for proof. */
export function buildIuranPayProofPromptText(ctx: {
  monthRangeLabel: string;
  monthCount: number;
  totalAmount: number;
  paymentInfo: string;
  /** Future (bayar di muka) months included in this payment, if any. */
  advanceMonths?: number;
}): string {
  const lines = [
    `Anda akan membayar Iuran Warga ${ctx.monthRangeLabel} (${ctx.monthCount} bulan).`,
  ];
  if (ctx.advanceMonths && ctx.advanceMonths > 0) {
    lines.push(`_(termasuk ${ctx.advanceMonths} bulan di muka)_`);
  }
  lines.push(
    `Total: *${formatIdr(ctx.totalAmount)}*`,
    '',
    'Silakan transfer ke:',
    ctx.paymentInfo || '-',
    '',
    'Setelah transfer, balas pesan ini dengan *foto/screenshot bukti transfer* (gambar/PDF).',
    '',
    '_Ketik *menu* untuk membatalkan._',
  );
  return lines.join('\n');
}

/** Pushed to the resident when their Iuran Warga payment is verified. */
export function buildIuranPayApprovedText(
  name: string | null,
  referenceNumber: string,
): string {
  const greeting = name?.trim() ? `Yth. ${name.trim()}` : 'Yth. Bapak/Ibu';
  return [
    `${greeting},`,
    '',
    '✅ *Pembayaran Iuran Warga Anda telah disetujui.*',
    '',
    `Nomor referensi: *${referenceNumber}*`,
    'Kwitansi (PDF) terlampir. Terima kasih. 🙏',
  ].join('\n');
}
