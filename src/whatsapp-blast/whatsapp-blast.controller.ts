import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WhatsappBlastService } from './whatsapp-blast.service';
import { WhatsappClientService } from './whatsapp-client.service';
import { TriggerBlastDto } from './dto/trigger-blast.dto';
import { SendTestDto } from './dto/send-test.dto';
import { QueryBlastsDto } from './dto/query-blasts.dto';
import { QueryIplPaymentMatrixDto } from '../ipl-payments/dto/query-ipl-payment-matrix.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Whatsapp Blast')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ACCOUNTANT')
@Controller('whatsapp-blast')
export class WhatsappBlastController {
  constructor(
    private readonly blastService: WhatsappBlastService,
    private readonly client: WhatsappClientService,
  ) {}

  // ------------------------------------------------------------------
  // Connection lifecycle
  // ------------------------------------------------------------------

  @Get('status')
  @ApiOperation({ summary: 'Status koneksi WhatsApp + QR pairing (data URL)' })
  @ApiResponse({ status: 200, description: 'Status koneksi' })
  getStatus() {
    return this.client.getStatus();
  }

  @Post('connect')
  @ApiOperation({ summary: 'Hubungkan / re-connect sesi WhatsApp (Baileys)' })
  @ApiResponse({ status: 200, description: 'Proses koneksi dimulai' })
  connect() {
    return this.client.connect();
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Putuskan sesi WhatsApp (kredensial tetap tersimpan)' })
  @ApiResponse({ status: 200, description: 'Sesi diputus' })
  disconnect() {
    return this.client.disconnect();
  }

  @Post('reset-pairing')
  @ApiOperation({
    summary:
      'Ganti nomor admin: hapus sesi lama (logout) lalu keluarkan QR baru untuk nomor baru',
  })
  @ApiResponse({ status: 200, description: 'Sesi direset, QR baru diterbitkan' })
  resetPairing() {
    return this.client.resetPairing();
  }

  @Post('send-test')
  @ApiOperation({ summary: 'Kirim satu pesan uji (tidak dicatat sebagai blast)' })
  @ApiResponse({ status: 200, description: 'Pesan uji terkirim' })
  sendTest(@Body() dto: SendTestDto) {
    return this.blastService.sendTest(dto);
  }

  // ------------------------------------------------------------------
  // Delinquent targeting + blast
  // ------------------------------------------------------------------

  @Get('delinquents')
  @ApiOperation({
    summary:
      'Preview daftar warga nunggak + isi pesan (tidak mengirim apa pun)',
  })
  @ApiResponse({ status: 200, description: 'Daftar target + preview pesan' })
  getDelinquents(@Query() query: QueryIplPaymentMatrixDto) {
    return this.blastService.getDelinquentPreview(query);
  }

  @Post('blast')
  @ApiOperation({
    summary:
      'Jalankan blast nagih tunggakan. dryRun=true untuk simulasi tanpa kirim.',
  })
  @ApiResponse({ status: 200, description: 'Ringkasan hasil blast' })
  triggerBlast(
    @Body() dto: TriggerBlastDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.blastService.triggerBlast(dto, userId);
  }

  // ------------------------------------------------------------------
  // History
  // ------------------------------------------------------------------

  @Get('batches')
  @ApiOperation({ summary: 'Riwayat blast (paginated)' })
  @ApiResponse({ status: 200, description: 'Daftar blast' })
  findMany(@Query() query: QueryBlastsDto) {
    return this.blastService.findMany(query);
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Detail satu batch beserta recipient-nya' })
  @ApiResponse({ status: 200, description: 'Detail batch' })
  findOne(@Param('id') id: string) {
    return this.blastService.findOne(id);
  }
}
