import { PartialType } from '@nestjs/swagger';
import { CreateHouseUnitDto } from './create-house-unit.dto';

export class UpdateHouseUnitDto extends PartialType(CreateHouseUnitDto) {}
