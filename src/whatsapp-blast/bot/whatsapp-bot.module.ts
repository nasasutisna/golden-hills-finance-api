import { Module } from '@nestjs/common';
import { WhatsappBlastModule } from '../whatsapp-blast.module';
import { IplPaymentsModule } from '../../ipl-payments/ipl-payments.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsappBotController } from './whatsapp-bot.controller';
import { WhatsappBotService } from './whatsapp-bot.service';

/**
 * The WhatsApp CS bot, isolated as its own feature module.
 *
 * It composes two capabilities:
 *  - {@link WhatsappBlastModule} → provides `WhatsappClientService` (the socket
 *    the bot registers its incoming-message handler on), and
 *  - {@link IplPaymentsModule} → provides `IplPaymentsService` (the delinquency
 *    data the bot answers with).
 *
 * This module is a leaf: nothing in the IplPayments / Users chain imports it
 * back, so importing IplPaymentsModule here does NOT close a cycle. Keeping the
 * bot out of `WhatsappBlastModule` is what keeps the dependency graph acyclic
 * (see the note in whatsapp-blast.module.ts).
 */
@Module({
  imports: [WhatsappBlastModule, IplPaymentsModule, PrismaModule],
  controllers: [WhatsappBotController],
  providers: [WhatsappBotService],
})
export class WhatsappBotModule {}
