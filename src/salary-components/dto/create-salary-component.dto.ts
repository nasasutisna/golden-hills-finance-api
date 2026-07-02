import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export enum ComponentType {
  BASIC = 'BASIC',
  ALLOWANCE = 'ALLOWANCE',
  DEDUCTION = 'DEDUCTION',
  BONUS = 'BONUS',
  OVERTIME = 'OVERTIME',
  TAX = 'TAX',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER',
}

export enum CalculationType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  FORMULA = 'FORMULA',
}

export class CreateSalaryComponentDto {
  @ApiProperty({
    description: 'Component code',
    example: 'BASIC',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Component code is required' })
  @IsString()
  @MaxLength(50)
  componentCode: string;

  @ApiProperty({
    description: 'Component name',
    example: 'Basic Salary',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Component name is required' })
  @IsString()
  @MaxLength(100)
  componentName: string;

  @ApiProperty({
    description: 'Component description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Component type',
    enum: ComponentType,
    example: ComponentType.BASIC,
  })
  @IsNotEmpty({ message: 'Component type is required' })
  @IsEnum(ComponentType, { message: 'Invalid component type' })
  componentType: ComponentType;

  @ApiProperty({
    description: 'Calculation type',
    enum: CalculationType,
    example: CalculationType.FIXED,
  })
  @IsNotEmpty({ message: 'Calculation type is required' })
  @IsEnum(CalculationType, { message: 'Invalid calculation type' })
  calculationType: CalculationType;

  @ApiProperty({
    description: 'Default value (for FIXED type)',
    example: 5000000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultValue?: number;

  @ApiProperty({
    description: 'Percentage value (for PERCENTAGE type)',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  percentageValue?: number;

  @ApiProperty({
    description: 'Formula (for FORMULA type)',
    required: false,
  })
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiProperty({
    description: 'Is tax subject',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isTaxSubject?: boolean = true;

  @ApiProperty({
    description: 'Calculation order',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  calculationOrder?: number;

  @ApiProperty({
    description: 'Is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Account code for accounting integration',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountCode?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
