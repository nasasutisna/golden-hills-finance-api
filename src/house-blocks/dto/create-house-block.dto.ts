import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BlockType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  MIXED = 'MIXED',
}

export class CreateHouseBlockDto {
  @ApiProperty({
    description: 'Block code (unique identifier)',
    example: 'BLK-A',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Block code is required' })
  @IsString()
  @MaxLength(20, { message: 'Block code must not exceed 20 characters' })
  blockCode: string;

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
    description: 'Block type',
    enum: BlockType,
    default: BlockType.RESIDENTIAL,
  })
  @IsNotEmpty({ message: 'Block type is required' })
  @IsEnum(BlockType, { message: 'Invalid block type' })
  blockType: BlockType;

  @ApiProperty({
    description: 'Address',
    example: 'Jalan Golden Hills Block A',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    description: 'Total number of units',
    example: 24,
    default: 0,
  })
  @IsNotEmpty({ message: 'Total units is required' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  totalUnits: number = 0;

  @ApiProperty({
    description: 'Total number of floors',
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  totalFloors?: number;

  @ApiProperty({
    description: 'Construction year',
    example: 2020,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Type(() => Number)
  constructionYear?: number;

  @ApiProperty({
    description: 'Land area in square meters',
    example: 2000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  landArea?: number;

  @ApiProperty({
    description: 'Building area in square meters',
    example: 1500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  buildingArea?: number;

  @ApiProperty({
    description: 'Facilities (JSON object)',
    example: '{"parking": true, "gym": true, "pool": true}',
    required: false,
  })
  @IsOptional()
  facilities?: string;

  @ApiProperty({
    description: 'Additional amenities',
    required: false,
  })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiProperty({
    description: 'Is block active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
}
