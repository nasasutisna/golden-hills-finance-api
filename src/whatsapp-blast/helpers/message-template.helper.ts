/**
 * Reminder message template + placeholder substitution for the WhatsApp blast.
 *
 * The default Indonesian template includes everything the product agreed to:
 * recipient name + unit, overdue months, exact amount, and payment/contact info.
 * It can be overridden end-to-end via WHATSAPP_MESSAGE_TEMPLATE.
 */

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Placeholders available to any template (built-in or custom). */
export interface MessageContext {
  /** Resident display name (falls back to "Warga" when unknown). */
  name: string | null;
  unit: string | null;
  block: string | null;
  /** Human range, e.g. "Mei – Juli 2026". */
  monthRange: string;
  /** Number of overdue months. */
  months: number;
  /** Outstanding amount in IDR (formatted as currency). */
  amount: number;
  /** Payment instructions / contact line. */
  paymentInfo: string;
  companyName: string;
}

/** Built-in Indonesian template — covers name/unit, months, amount, payment info. */
export const DEFAULT_MESSAGE_TEMPLATE = `Assalamualaikum / Selamat siang,

Yth. {{name}}
Unit {{unit}}{{block}}
{{companyName}}

Kami sampaikan bahwa berdasarkan catatan kami terdapat tunggakan Iuran Pemeliharaan Lingkungan (IPL) untuk periode {{monthRange}} ({{months}} bulan), dengan total sebesar *{{amount}}*.

Mohon dapat segera dilunasi. Untuk informasi pembayaran dan pertanyaan lainnya, silakan hubungi:
{{paymentInfo}}

Terima kasih atas perhatian dan kerjasamanya.

— {{companyName}}`;

function fill(template: string, ctx: MessageContext): string {
  const blockSuffix = ctx.block ? ` — ${ctx.block}` : '';
  const name = ctx.name?.trim() || 'Warga';
  const unit = ctx.unit?.trim() || '-';
  const amount =
    Number.isFinite(ctx.amount) && ctx.amount > 0
      ? idrFormatter.format(ctx.amount)
      : idrFormatter.format(0);

  return template
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{unit\}\}/g, unit)
    .replace(/\{\{block\}\}/g, blockSuffix)
    .replace(/\{\{monthRange\}\}/g, ctx.monthRange)
    .replace(/\{\{months\}\}/g, String(ctx.months))
    .replace(/\{\{amount\}\}/g, amount)
    .replace(/\{\{paymentInfo\}\}/g, ctx.paymentInfo || '-')
    .replace(/\{\{companyName\}\}/g, ctx.companyName);
}

/**
 * Build the final message. If `customTemplate` is provided (non-empty) it fully
 * overrides the built-in template — useful for WHATSAPP_MESSAGE_TEMPLATE.
 */
export function buildMessage(
  ctx: MessageContext,
  customTemplate?: string | null,
): string {
  const template =
    customTemplate && customTemplate.trim() ? customTemplate : DEFAULT_MESSAGE_TEMPLATE;
  return fill(template, ctx).trim();
}
