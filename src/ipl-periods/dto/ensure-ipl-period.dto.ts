import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class EnsureIplPeriodDto {
  @ApiProperty({
    description: 'Month (1-12) whose period must exist',
    example: 8,
    minimum: 1,
    maximum: 12,
  })
  @IsNotEmpty({ message: 'Month is required' })
  @IsInt({ message: 'Month must be an integer' })
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  @Type(() => Number)
  month: number;

  @ApiProperty({
    description: 'Year whose period must exist',
    example: 2026,
  })
  @IsNotEmpty({ message: 'Year is required' })
  @IsInt({ message: 'Year must be an integer' })
  @Min(2000, { message: 'Year must be >= 2000' })
  @Max(2100, { message: 'Year must be <= 2100' })
  @Type(() => Number)
  year: number;
}
