import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionCategoryDto {
  @ApiProperty({
    description: 'Category code (unique identifier)',
    example: 'CAT001',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Category code is required' })
  @IsString()
  @MaxLength(20)
  categoryCode: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Service Fee Income',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Category name is required' })
  @IsString()
  @MaxLength(100)
  categoryName: string;

  @ApiProperty({
    description: 'Category description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Category type',
    enum: CategoryType,
  })
  @IsNotEmpty({ message: 'Category type is required' })
  @IsEnum(CategoryType, { message: 'Invalid category type' })
  categoryType: CategoryType;

  @ApiProperty({
    description: 'Parent category ID (for sub-categories)',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentCategoryId?: string;

  @ApiProperty({
    description: 'Budget code (for budgeting)',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  budgetCode?: string;

  @ApiProperty({
    description: 'Is category active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean = true;
}
