import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import {
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
import { CreateIplPeriodDto, IplPeriodStatus } from './create-ipl-period.dto';

export class UpdateIplPeriodDto extends PartialType(CreateIplPeriodDto) {
  @ApiProperty({
    description: 'Period code (unique identifier)',
    example: 'IPL-2026-07',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  periodCode?: string;

  @ApiProperty({
    description: 'Period name',
    example: 'IPL Juli 2026',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  periodName?: string;

  @ApiProperty({
    description: 'Month (1-12)',
    example: 7,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiProperty({
    description: 'Year',
    example: 2026,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number;

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
