import { Module } from '@nestjs/common';
import { WhatsappBlastModule } from '../whatsapp-blast.module';
import { IplPaymentsModule } from '../../ipl-payments/ipl-payments.module';
import { IplPeriodsModule } from '../../ipl-periods/ipl-periods.module';
import { ResidentPaymentsModule } from '../../resident-payments/resident-payments.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsappBotController } from './whatsapp-bot.controller';
import { WhatsappBotService } from './whatsapp-bot.service';

/**
 * The WhatsApp CS bot, isolated as its own feature module.
 *
 * It composes several capabilities:
 *  - {@link WhatsappBlastModule} → provides `WhatsappClientService` (the socket
 *    the bot registers its incoming-message handler on),
 *  - {@link IplPaymentsModule} → provides `IplPaymentsService` (the IPL
 *    delinquency data + bot-payment creation), and
 *  - {@link ResidentPaymentsModule} → provides `ResidentPaymentsService` (the
 *    Iuran Warga outstanding data + bot-payment creation), and
 *  - {@link IplPeriodsModule} → provides `IplPeriodsService` (on-demand
 *    `IplPeriod` creation for advance / bayar-di-muka IPL months).
 *
 * This module is a leaf: nothing in the IplPayments / ResidentPayments / Users
 * chain imports it back, so importing those modules here does NOT close a
 * cycle. Keeping the bot out of `WhatsappBlastModule` is what keeps the
 * dependency graph acyclic (see the note in whatsapp-blast.module.ts).
 */
@Module({
  imports: [WhatsappBlastModule, IplPaymentsModule, IplPeriodsModule, ResidentPaymentsModule, PrismaModule],
  controllers: [WhatsappBotController],
  providers: [WhatsappBotService],
})
export class WhatsappBotModule {}
