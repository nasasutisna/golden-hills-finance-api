import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum IplPeriodStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export class CreateIplPeriodDto {
  @ApiProperty({
    description: 'Period code (unique identifier)',
    example: 'IPL-2026-07',
  })
  @IsNotEmpty({ message: 'Period code is required' })
  @IsString()
  @MaxLength(20)
  periodCode: string;

  @ApiProperty({
    description: 'Period name',
    example: 'IPL Juli 2026',
  })
  @IsNotEmpty({ message: 'Period name is required' })
  @IsString()
  @MaxLength(100)
  periodName: string;

  @ApiProperty({
    description: 'Month (1-12)',
    example: 7,
  })
  @IsNotEmpty({ message: 'Month is required' })
  @IsNumber()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @ApiProperty({
    description: 'Year',
    example: 2026,
  })
  @IsNotEmpty({ message: 'Year is required' })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @ApiProperty({
    description: 'Base rate per square meter',
    example: 2500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  baseRate?: number;

  @ApiProperty({
    description: 'Period status',
    enum: IplPeriodStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(IplPeriodStatus)
  status?: IplPeriodStatus;

  @ApiProperty({
    description: 'Due date for payments',
    example: '2026-07-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
