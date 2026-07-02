import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FeeCategory {
  MAINTENANCE = 'MAINTENANCE',
  UTILITIES = 'UTILITIES',
  SECURITY = 'SECURITY',
  OTHERS = 'OTHERS',
}

export enum RecurringPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export class CreateFeeTypeDto {
  @ApiProperty({
    description: 'Fee code (unique identifier)',
    example: 'FEE001',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Fee code is required' })
  @IsString()
  @MaxLength(20)
  feeCode: string;

  @ApiProperty({
    description: 'Fee name',
    example: 'Monthly Maintenance Fee',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Fee name is required' })
  @IsString()
  @MaxLength(100)
  feeName: string;

  @ApiProperty({
    description: 'Fee description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Fee category',
    enum: FeeCategory,
  })
  @IsNotEmpty({ message: 'Fee category is required' })
  @IsEnum(FeeCategory, { message: 'Invalid fee category' })
  feeCategory: FeeCategory;

  @ApiProperty({
    description: 'Is recurring fee',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = false;

  @ApiProperty({
    description: 'Recurring period',
    enum: RecurringPeriod,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecurringPeriod, { message: 'Invalid recurring period' })
  recurringPeriod?: RecurringPeriod;

  @ApiProperty({
    description: 'Is taxable',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean = false;

  @ApiProperty({
    description: 'Tax rate (%)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxRate?: number;

  @ApiProperty({
    description: 'Default amount',
    example: 500000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  defaultAmount?: number;

  @ApiProperty({
    description: 'Is fee type active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
