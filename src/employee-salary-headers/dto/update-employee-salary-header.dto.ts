import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmployeeSalaryHeaderDto } from './create-employee-salary-header.dto';

export class UpdateEmployeeSalaryHeaderDto extends PartialType(
  OmitType(CreateEmployeeSalaryHeaderDto, ['payrollNumber', 'employeeId'] as const)
) {}
