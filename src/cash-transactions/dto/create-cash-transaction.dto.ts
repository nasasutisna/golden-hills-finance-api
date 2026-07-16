import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { REFERENCE_TYPE_OPTIONS } from '../../common/constants/reference-types';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateCashTransactionDto {
  @ApiProperty({
    description: 'Transaction date',
    example: '2024-01-15',
  })
  @IsNotEmpty({ message: 'Transaction date is required' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
  })
  @IsNotEmpty({ message: 'Transaction type is required' })
  @IsEnum(TransactionType, { message: 'Invalid transaction type' })
  transactionType: TransactionType;

  @ApiProperty({
    description: 'Category ID',
    example: 'uuid-of-category',
  })
  @IsNotEmpty({ message: 'Category is required' })
  @IsString()
  categoryId: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 500000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'TRANSFER',
    enum: ['CASH', 'TRANSFER', 'CARD'],
  })
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(['CASH', 'TRANSFER', 'CARD'], { message: 'Invalid payment method' })
  paymentMethod: string;

  @ApiProperty({
    description: 'Reference type (IPL_PAYMENT, KEGIATAN_PAYMENT, IPL_EXPENSE, KEGIATAN_EXPENSE, etc.)',
    example: 'IPL_EXPENSE',
    enum: REFERENCE_TYPE_OPTIONS,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @IsIn(REFERENCE_TYPE_OPTIONS, { message: 'Invalid reference type' })
  referenceType?: string;

  @ApiProperty({
    description: 'Reference ID (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({
    description: 'Reference number (optional)',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Monthly maintenance fee payment',
  })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'Requires approval',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean = false;

  @ApiProperty({
    description: 'IP address',
    required: false,
    maxLength: 45,
  })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
