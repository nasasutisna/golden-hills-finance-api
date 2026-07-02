import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeePositionDto {
  @ApiProperty({
    description: 'Position code (unique identifier)',
    example: 'POS001',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Position code is required' })
  @IsString()
  @MaxLength(20)
  positionCode: string;

  @ApiProperty({
    description: 'Position name',
    example: 'Finance Manager',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Position name is required' })
  @IsString()
  @MaxLength(100)
  positionName: string;

  @ApiProperty({
    description: 'Department',
    example: 'Finance',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiProperty({
    description: 'Position description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Salary grade',
    example: 'M2',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  salaryGrade?: string;

  @ApiProperty({
    description: 'Position level (1-10 hierarchy)',
    example: 8,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  level?: number;

  @ApiProperty({
    description: 'Is position active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean = true;
}
