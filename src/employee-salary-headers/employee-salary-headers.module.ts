import { Module } from '@nestjs/common';
import { EmployeeSalaryHeadersController } from './employee-salary-headers.controller';
import { EmployeeSalaryHeadersService } from './employee-salary-headers.service';
import { EmployeeSalaryHeadersRepository } from './employee-salary-headers.repository';
import { CashTransactionsModule } from '../cash-transactions/cash-transactions.module';

@Module({
  imports: [CashTransactionsModule],
  controllers: [EmployeeSalaryHeadersController],
  providers: [EmployeeSalaryHeadersService, EmployeeSalaryHeadersRepository],
  exports: [EmployeeSalaryHeadersService, EmployeeSalaryHeadersRepository],
})
export class EmployeeSalaryHeadersModule {}
