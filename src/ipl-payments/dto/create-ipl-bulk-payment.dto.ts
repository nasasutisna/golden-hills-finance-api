import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { PaymentMethod } from './enums';

export class CreateIplBulkPaymentDto {
  @ApiProperty({
    description: 'Starting period ID',
    example: 'uuid-of-start-period',
  })
  @IsNotEmpty({ message: 'Start period is required' })
  @IsString()
  startPeriodId: string;

  @ApiProperty({
    description: 'Resident ID (warga yang membayar)',
    example: 'uuid-of-resident',
  })
  @IsNotEmpty({ message: 'Resident is required' })
  @IsString()
  residentId: string;

  @ApiProperty({
    description: 'Number of months to pay (6, 12, etc.)',
    example: 6,
    minimum: 2,
    maximum: 24,
  })
  @IsNotEmpty({ message: 'Month count is required' })
  @IsNumber()
  @Min(2, { message: 'Minimum 2 months for bulk payment' })
  @Max(24, { message: 'Maximum 24 months for bulk payment' })
  monthCount: number;

  @ApiProperty({
    description: 'Payment date (tanggal pembayaran)',
    example: '2026-07-09',
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
    description: 'Reference number (nomor referensi transfer)',
    example: 'REF123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiProperty({
    description: 'Additional notes (catatan tambahan)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({
    description: 'Proof file ID from file attachments',
    example: 'uuid-of-file',
    required: false,
  })
  @IsOptional()
  @IsString()
  proofFileId?: string;
}
