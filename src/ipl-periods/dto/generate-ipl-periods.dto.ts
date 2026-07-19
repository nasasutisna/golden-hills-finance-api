import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IplPeriodStatus } from './create-ipl-period.dto';

export class GenerateIplPeriodsDto {
  @ApiProperty({
    description: 'Year to generate 12 monthly periods (Jan-Dec) for',
    example: 2026,
  })
  @IsNotEmpty({ message: 'Year is required' })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @ApiProperty({
    description: 'Base rate per square meter applied to all 12 periods',
    example: 2500,
    required: false,
    default: 2500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  baseRate?: number;

  @ApiProperty({
    description: 'Status applied to all 12 periods',
    enum: IplPeriodStatus,
    required: false,
    default: IplPeriodStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(IplPeriodStatus)
  status?: IplPeriodStatus;

  @ApiProperty({
    description:
      'Day of month used as the due date for each period (1-31). ' +
      'Clipped to the last day of shorter months (e.g. 31 in Feb -> 28/29). ' +
      'Omit to leave dueDate empty.',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  dueDay?: number;
}
