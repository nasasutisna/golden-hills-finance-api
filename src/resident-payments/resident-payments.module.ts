import { Module } from '@nestjs/common';
import { ResidentPaymentsController } from './resident-payments.controller';
import { ResidentPaymentsService } from './resident-payments.service';
import { ResidentPaymentsRepository } from './resident-payments.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ResidentsModule } from '../residents/residents.module';
import { ResidentInvoicesModule } from '../resident-invoices/resident-invoices.module';

@Module({
  imports: [PrismaModule, ResidentsModule, ResidentInvoicesModule],
  controllers: [ResidentPaymentsController],
  providers: [ResidentPaymentsService, ResidentPaymentsRepository],
  exports: [ResidentPaymentsService, ResidentPaymentsRepository],
})
export class ResidentPaymentsModule {}
