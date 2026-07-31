import { Module } from '@nestjs/common';
import { WhatsappBlastController } from './whatsapp-blast.controller';
import { WhatsappBlastService } from './whatsapp-blast.service';
import { WhatsappClientService } from './whatsapp-client.service';
import { WhatsappBlastRepository } from './whatsapp-blast.repository';
import { PrismaModule } from '../prisma/prisma.module';

// NOTE: the CS bot (WhatsappBotService) intentionally lives in its own
// WhatsappBotModule, NOT here. Putting it here would require importing
// IplPaymentsModule, which closes a cycle (IplPayments → CashTransactions →
// Users → WhatsappBlast). WhatsappBotModule composes this module + IplPayments
// with no back-edge, so the graph stays acyclic.

@Module({
  imports: [PrismaModule],
  controllers: [WhatsappBlastController],
  providers: [WhatsappBlastService, WhatsappClientService, WhatsappBlastRepository],
  exports: [WhatsappBlastService, WhatsappClientService],
})
export class WhatsappBlastModule {}
