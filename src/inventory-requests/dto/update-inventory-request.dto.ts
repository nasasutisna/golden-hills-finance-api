import { PartialType } from '@nestjs/swagger';
import { CreateInventoryRequestDto } from './create-inventory-request.dto';

export class UpdateInventoryRequestDto extends PartialType(CreateInventoryRequestDto) {}
