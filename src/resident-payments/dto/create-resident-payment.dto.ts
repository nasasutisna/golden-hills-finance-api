import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  IsEnum,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
  E_WALLET = 'E_WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CreateResidentPaymentDto {
  @ApiProperty({
    description: 'Resident ID',
    example: 'uuid-of-resident',
  })
  @IsNotEmpty({ message: 'Resident is required' })
  @IsString()
  residentId: string;

  @ApiProperty({
    description: 'Invoice ID',
    example: 'uuid-of-invoice',
  })
  @IsNotEmpty({ message: 'Invoice is required' })
  @IsString()
  invoiceId: string;

  @ApiProperty({
    description: 'Payment date',
    example: '2024-01-15',
  })
  @IsNotEmpty({ message: 'Payment date is required' })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
  })
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Payment channel',
    example: 'BCA',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentChannel?: string;

  @ApiProperty({
    description: 'Reference number',
    example: 'REF123456789',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 500000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Bank name',
    example: 'BCA',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @ApiProperty({
    description: 'Account number',
    example: '1234567890',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
