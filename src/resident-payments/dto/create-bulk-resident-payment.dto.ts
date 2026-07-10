import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsArray,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  IsEnum,
  MaxLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from './create-resident-payment.dto';

export class BulkPaymentItemDto {
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

export class CreateBulkResidentPaymentDto {
  @ApiProperty({
    description: 'Array of payment items to create',
    type: [BulkPaymentItemDto],
  })
  @IsNotEmpty({ message: 'Payments array is required' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkPaymentItemDto)
  payments: BulkPaymentItemDto[];

  @ApiProperty({
    description: 'Optional notes for the bulk payment batch',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  batchNotes?: string;
}

export class BulkPaymentResultDto {
  @ApiProperty({
    description: 'Successfully created payments',
    type: [Object],
  })
  successful: any[];

  @ApiProperty({
    description: 'Failed payment attempts',
    type: [Object],
  })
  failed: Array<{
    payment: BulkPaymentItemDto;
    error: string;
  }>;

  @ApiProperty({
    description: 'Total number of payments attempted',
  })
  total: number;

  @ApiProperty({
    description: 'Number of successful payments',
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed payments',
  })
  failureCount: number;
}
