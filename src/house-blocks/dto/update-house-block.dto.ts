import { PartialType } from '@nestjs/swagger';
import { CreateHouseBlockDto } from './create-house-block.dto';

export class UpdateHouseBlockDto extends PartialType(CreateHouseBlockDto) {}
