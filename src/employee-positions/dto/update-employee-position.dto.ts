import { PartialType } from '@nestjs/swagger';
import { CreateEmployeePositionDto } from './create-employee-position.dto';

export class UpdateEmployeePositionDto extends PartialType(CreateEmployeePositionDto) {}
