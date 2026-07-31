import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WhatsappBotService } from './whatsapp-bot.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Observability endpoints for the WhatsApp CS bot. Same auth surface as the
 * blast controller (ADMIN / ACCOUNTANT). Sits under /whatsapp-blast/bot so it
 * groups with the rest of the WhatsApp API.
 */
@ApiTags('Whatsapp Bot')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ACCOUNTANT')
@Controller('whatsapp-blast/bot')
export class WhatsappBotController {
  constructor(private readonly bot: WhatsappBotService) {}

  @Get('status')
  @ApiOperation({
    summary:
      'Status bot CS: aktif? socket terhubung? pesan terakhir masuk. Untuk men-debug bot yang tidak membalas.',
  })
  @ApiResponse({ status: 200, description: 'Status bot' })
  getStatus() {
    return this.bot.getBotStatus();
  }
}
