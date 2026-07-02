import { Module } from '@nestjs/common';
import { ResidentInvoicesController } from './resident-invoices.controller';
import { ResidentInvoicesService } from './resident-invoices.service';
import { ResidentInvoicesRepository } from './resident-invoices.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ResidentsModule } from '../residents/residents.module';
import { FeeTypesModule } from '../fee-types/fee-types.module';

@Module({
  imports: [PrismaModule, ResidentsModule, FeeTypesModule],
  controllers: [ResidentInvoicesController],
  providers: [ResidentInvoicesService, ResidentInvoicesRepository],
  exports: [ResidentInvoicesService, ResidentInvoicesRepository],
})
export class ResidentInvoicesModule {}
