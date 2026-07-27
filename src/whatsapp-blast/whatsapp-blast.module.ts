import { Module } from '@nestjs/common';
import { WhatsappBlastController } from './whatsapp-blast.controller';
import { WhatsappBlastService } from './whatsapp-blast.service';
import { WhatsappClientService } from './whatsapp-client.service';
import { WhatsappBlastRepository } from './whatsapp-blast.repository';
import { PrismaModule } from '../prisma/prisma.module';
// import { IplPaymentsModule } from '../ipl-payments/ipl-payments.module';

@Module({
  imports: [PrismaModule],
  controllers: [WhatsappBlastController],
  providers: [WhatsappBlastService, WhatsappClientService, WhatsappBlastRepository],
  exports: [WhatsappBlastService, WhatsappClientService],
})
export class WhatsappBlastModule {}
