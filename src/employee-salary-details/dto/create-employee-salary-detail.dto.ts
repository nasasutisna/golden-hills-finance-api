import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateEmployeeSalaryDetailDto {
  @ApiProperty({
    description: 'Salary header ID',
    example: 'uuid-of-salary-header',
  })
  @IsNotEmpty({ message: 'Salary header is required' })
  @IsString()
  salaryHeaderId: string;

  @ApiProperty({
    description: 'Salary component ID',
    example: 'uuid-of-salary-component',
  })
  @IsNotEmpty({ message: 'Salary component is required' })
  @IsString()
  componentId: string;

  @ApiProperty({
    description: 'Amount',
    example: 5000000,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({
    description: 'Is manual override',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  manualOverride?: boolean = false;

  @ApiProperty({
    description: 'Notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
