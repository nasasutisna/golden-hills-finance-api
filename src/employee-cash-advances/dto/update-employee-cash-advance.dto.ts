import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmployeeCashAdvanceDto } from './create-employee-cash-advance.dto';

export class UpdateEmployeeCashAdvanceDto extends PartialType(
  OmitType(CreateEmployeeCashAdvanceDto, ['advanceNumber', 'employeeId'] as const)
) {}
