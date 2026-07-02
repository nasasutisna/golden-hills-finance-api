import { Module } from '@nestjs/common';
import { EmployeeCashAdvancesController } from './employee-cash-advances.controller';
import { EmployeeCashAdvancesService } from './employee-cash-advances.service';
import { EmployeeCashAdvancesRepository } from './employee-cash-advances.repository';

@Module({
  controllers: [EmployeeCashAdvancesController],
  providers: [EmployeeCashAdvancesService, EmployeeCashAdvancesRepository],
  exports: [EmployeeCashAdvancesService, EmployeeCashAdvancesRepository],
})
export class EmployeeCashAdvancesModule {}
