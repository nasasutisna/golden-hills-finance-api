import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmployeeSalaryDetailDto } from './create-employee-salary-detail.dto';

export class UpdateEmployeeSalaryDetailDto extends PartialType(
  OmitType(CreateEmployeeSalaryDetailDto, ['salaryHeaderId'] as const)
) {}
