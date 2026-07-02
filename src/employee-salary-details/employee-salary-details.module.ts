import { Module } from '@nestjs/common';
import { EmployeeSalaryDetailsController } from './employee-salary-details.controller';
import { EmployeeSalaryDetailsService } from './employee-salary-details.service';
import { EmployeeSalaryDetailsRepository } from './employee-salary-details.repository';

@Module({
  controllers: [EmployeeSalaryDetailsController],
  providers: [EmployeeSalaryDetailsService, EmployeeSalaryDetailsRepository],
  exports: [EmployeeSalaryDetailsService, EmployeeSalaryDetailsRepository],
})
export class EmployeeSalaryDetailsModule {}
