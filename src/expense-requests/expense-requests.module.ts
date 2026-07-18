import { Module } from '@nestjs/common';
import { ExpenseRequestsController } from './expense-requests.controller';
import { ExpenseRequestsService } from './expense-requests.service';
import { ExpenseRequestsRepository } from './expense-requests.repository';
import { CashTransactionsModule } from '../cash-transactions/cash-transactions.module';
import { TransactionCategoriesModule } from '../transaction-categories/transaction-categories.module';

@Module({
  imports: [CashTransactionsModule, TransactionCategoriesModule],
  controllers: [ExpenseRequestsController],
  providers: [ExpenseRequestsService, ExpenseRequestsRepository],
  exports: [ExpenseRequestsService, ExpenseRequestsRepository],
})
export class ExpenseRequestsModule {}
