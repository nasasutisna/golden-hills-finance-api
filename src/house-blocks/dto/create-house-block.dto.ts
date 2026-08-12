import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateHouseBlockDto {
  @ApiProperty({
    description: 'Block code (unique identifier). Omit to auto-generate BLK-001 sequence.',
    example: 'BLK-001',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Block code must not exceed 20 characters' })
  blockCode?: string;

  @ApiProperty({
    description: 'Block name',
    example: 'Block A - Residential',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Block name is required' })
  @IsString()
  @MaxLength(100)
  blockName: string;

  @ApiProperty({
    description: 'Additional description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Coordinator user ID (block coordinator)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  coordinatorId?: string;

  @ApiProperty({
    description: 'Unit IDs to assign to this block (only units without a block are assigned)',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignUnitIds?: string[];

  @ApiProperty({
    description: 'Unit IDs to release from this block (set houseBlockId back to null)',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unassignUnitIds?: string[];
}
