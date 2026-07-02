import { Module } from '@nestjs/common';
import { CashTransactionsController } from './cash-transactions.controller';
import { CashTransactionsService } from './cash-transactions.service';
import { CashTransactionsRepository } from './cash-transactions.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionCategoriesModule } from '../transaction-categories/transaction-categories.module';
import { UsersModule } from '../users/users.module';
import { ApprovalHistoriesModule } from '../approval-histories/approval-histories.module';

@Module({
  imports: [
    PrismaModule,
    TransactionCategoriesModule,
    UsersModule,
    ApprovalHistoriesModule,
  ],
  controllers: [CashTransactionsController],
  providers: [CashTransactionsService, CashTransactionsRepository],
  exports: [CashTransactionsService, CashTransactionsRepository],
})
export class CashTransactionsModule {}
