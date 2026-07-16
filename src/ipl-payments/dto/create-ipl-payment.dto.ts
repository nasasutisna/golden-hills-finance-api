import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { PaymentMethod } from './enums';

export class CreateIplPaymentDto {
  @ApiProperty({
    description: 'Period ID (bulan tahun pembayaran - start period if monthCount > 1)',
    example: 'uuid-of-period',
  })
  @IsNotEmpty({ message: 'Period is required' })
  @IsString()
  periodId: string;

  @ApiProperty({
    description: 'Number of months to pay (1-24, default: 1)',
    example: 6,
    minimum: 1,
    maximum: 24,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Month count must be an integer' })
  @Min(1, { message: 'Minimum 1 month' })
  @Max(24, { message: 'Maximum 24 months' })
  monthCount?: number;

  @ApiProperty({
    description: 'Resident ID (warga yang membayar)',
    example: 'uuid-of-resident',
  })
  @IsNotEmpty({ message: 'Resident is required' })
  @IsString()
  residentId: string;

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
    description: 'Reference number (nomor referensi transfer - AUTO-GENERATED)',
    example: 'REF-20250114-0001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiProperty({
    description: 'Iuran kegiatan warga (optional - dalam Rupiah)',
    example: 200000,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Kegiatan amount must be a number' })
  @Min(0, { message: 'Kegiatan amount cannot be negative' })
  kegiatanAmount?: number;

  @ApiProperty({
    description: 'Additional notes (catatan tambahan)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  // File ID from FileAttachment (optional, can be linked separately)
  @ApiProperty({
    description: 'Proof file ID from file attachments',
    example: 'uuid-of-file',
    required: false,
  })
  @IsOptional()
  @IsString()
  proofFileId?: string;
}
