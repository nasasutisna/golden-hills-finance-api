import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CashTransactionsModule } from '../cash-transactions/cash-transactions.module';
import { IplPeriodsModule } from '../ipl-periods/ipl-periods.module';

@Module({
  imports: [PrismaModule, CashTransactionsModule, IplPeriodsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
