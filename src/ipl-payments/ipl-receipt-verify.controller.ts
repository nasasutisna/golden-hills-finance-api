import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { IplReceiptsService } from './ipl-receipts.service';

type PublicReceiptInfo = Awaited<ReturnType<IplReceiptsService['getPublicReceiptInfo']>>;

/**
 * PUBLIC endpoint (no auth). Scanned from the QR code printed on a receipt
 * so anyone can confirm a receipt's authenticity against the live database.
 */
@Controller('v/kwitansi')
export class IplReceiptVerifyController {
  private readonly companyName: string;

  constructor(
    private readonly receiptsService: IplReceiptsService,
    private readonly configService: ConfigService,
  ) {
    this.companyName = this.configService.get<string>('COMPANY_NAME', 'Paguyuban Warga Golden Hills');
  }

  @Get(':id')
  async verify(@Param('id') id: string, @Res() response: Response) {
    const info = await this.receiptsService.getPublicReceiptInfo(id);
    const html = info ? this.renderValid(info) : this.renderInvalid();
    response.set('Content-Type', 'text/html; charset=utf-8');
    response.send(html);
  }

  private renderValid(info: NonNullable<PublicReceiptInfo>): string {
    const approvedAt = info.approvedAt
      ? new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(info.approvedAt))
      : '-';

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verifikasi Kwitansi — ${this.escape(info.paymentNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #f4f6f8; color: #1a1a1a; }
    .wrap { max-width: 460px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.08); overflow: hidden; }
    .badge { background: #006400; color: #fff; text-align: center; padding: 18px 16px; }
    .badge .check { font-size: 34px; line-height: 1; }
    .badge .title { font-size: 18px; font-weight: 700; margin-top: 6px; letter-spacing: .5px; }
    .badge .sub { font-size: 12px; opacity: .9; margin-top: 4px; }
    .body { padding: 20px 18px; }
    .amount { text-align: center; margin-bottom: 18px; }
    .amount .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .amount .value { font-size: 26px; font-weight: 800; color: #006400; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 9px 0; font-size: 14px; border-bottom: 1px solid #eef0f2; vertical-align: top; }
    td.k { color: #6b7280; width: 42%; }
    td.v { font-weight: 600; text-align: right; word-break: break-word; }
    .status { text-align: center; margin: 16px 0 4px; }
    .status span { display: inline-block; background: #e7f4e7; color: #006400; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 999px; }
    .foot { text-align: center; font-size: 11px; color: #9aa0a6; padding: 0 18px 18px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="badge">
        <div class="check">✓</div>
        <div class="title">KWITANSI SAH &amp; TERVERIFIKASI</div>
        <div class="sub">${this.escape(this.companyName)}</div>
      </div>
      <div class="body">
        <div class="amount">
          <div class="label">Total Pembayaran</div>
          <div class="value">${this.escape(info.calculatedAmount)}</div>
        </div>
        <table>
          <tr><td class="k">No. Pembayaran</td><td class="v">${this.escape(info.paymentNumber)}</td></tr>
          <tr><td class="k">Nama Warga</td><td class="v">${this.escape(info.residentName)}</td></tr>
          <tr><td class="k">Blok / No.</td><td class="v">${this.escape(info.blockName)} / ${this.escape(info.houseUnitNumber)}</td></tr>
          <tr><td class="k">Periode</td><td class="v">${this.escape(info.periodName)}</td></tr>
          <tr><td class="k">Tanggal Bayar</td><td class="v">${this.escape(this.formatDate(info.paymentDate))}</td></tr>
          <tr><td class="k">Metode</td><td class="v">${this.escape(info.paymentMethod)}</td></tr>
          <tr><td class="k">Disetujui</td><td class="v">${this.escape(approvedAt)}${info.approvedBy ? ' (' + this.escape(info.approvedBy) + ')' : ''}</td></tr>
        </table>
        <div class="status"><span>SUDAH DIBAYAR / LUNAS</span></div>
      </div>
      <div class="foot">
        Data di atas diambil langsung dari sistem ${this.escape(this.companyName)}.<br />
        Kwitansi ini bukti pembayaran yang sah.
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  private renderInvalid(): string {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verifikasi Kwitansi — Tidak Valid</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #f4f6f8; color: #1a1a1a; }
    .wrap { max-width: 420px; margin: 0 auto; padding: 40px 16px; text-align: center; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.08); padding: 36px 24px; }
    .icon { font-size: 40px; color: #b00020; }
    .title { font-size: 18px; font-weight: 700; margin: 12px 0 6px; }
    .desc { font-size: 14px; color: #6b7280; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="icon">✕</div>
      <div class="title">KWITANSI TIDAK VALID</div>
      <div class="desc">
        Kwitansi tidak ditemukan atau pembayaran belum disetujui.<br />
        Periksa kembali QR code atau hubungi pengurus ${this.escape(this.companyName)}.
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  private escape(value: string | null | undefined): string {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
