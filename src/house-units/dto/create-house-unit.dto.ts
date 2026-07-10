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

export enum OccupancyStatus {
  FULLY_OCCUPIED = 'FULLY_OCCUPIED',
  OCCASIONALLY = 'OCCASIONALLY',
  VACANT = 'VACANT',
  RENTED = 'RENTED',
}

export class CreateHouseUnitDto {
  @ApiProperty({
    description: 'Unit code (unique identifier)',
    example: 'A-101',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Unit code is required' })
  @IsString()
  @MaxLength(20, { message: 'Unit code must not exceed 20 characters' })
  unitCode: string;

  @ApiProperty({
    description: 'Unit number',
    example: '101',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Unit number is required' })
  @IsString()
  @MaxLength(20)
  unitNumber: string;

  @ApiProperty({
    description: 'House block ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'House block ID is required' })
  @IsString()
  houseBlockId: string;

  @ApiProperty({
    description: 'Land area in square meters',
    example: 72.00,
  })
  @IsNotEmpty({ message: 'Land area is required' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  landArea: number;

  @ApiProperty({
    description: 'Building area in square meters',
    example: 45.00,
  })
  @IsNotEmpty({ message: 'Building area is required' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  buildingArea: number;

  @ApiProperty({
    description: 'Floor number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  floorNumber?: number;

  @ApiProperty({
    description: 'Unit type',
    example: 'Tipe 36',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitType?: string;

  @ApiProperty({
    description: 'Occupancy status',
    enum: OccupancyStatus,
    default: OccupancyStatus.VACANT,
  })
  @IsOptional()
  @IsEnum(OccupancyStatus, { message: 'Invalid occupancy status' })
  occupancyStatus?: OccupancyStatus;

  @ApiProperty({
    description: 'Additional notes about occupancy',
    example: 'Ditinggali seminggu sekali',
    required: false,
  })
  @IsOptional()
  @IsString()
  occupancyNotes?: string;

  @ApiProperty({
    description: 'Is unit buyback by bank',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isBankBuyback?: boolean;

  @ApiProperty({
    description: 'Buyback date',
    example: '2024-01-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  buybackDate?: Date;

  @ApiProperty({
    description: 'IPL percentage (100 for full, 50 for occasional/vacant)',
    example: 100,
    default: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  iplPercentage?: number;

  @ApiProperty({
    description: 'Is unit active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
