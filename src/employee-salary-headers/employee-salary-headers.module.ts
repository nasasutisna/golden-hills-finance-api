import { Module } from '@nestjs/common';
import { EmployeeSalaryHeadersController } from './employee-salary-headers.controller';
import { EmployeeSalaryHeadersService } from './employee-salary-headers.service';
import { EmployeeSalaryHeadersRepository } from './employee-salary-headers.repository';

@Module({
  controllers: [EmployeeSalaryHeadersController],
  providers: [EmployeeSalaryHeadersService, EmployeeSalaryHeadersRepository],
  exports: [EmployeeSalaryHeadersService, EmployeeSalaryHeadersRepository],
})
export class EmployeeSalaryHeadersModule {}
