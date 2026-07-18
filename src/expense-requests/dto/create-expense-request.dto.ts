import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  Min,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseRequestDto {
  @ApiProperty({ description: 'Short title of the request', example: 'Beli lampu taman' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed purpose / description of the expense',
    example: 'Pengganti 5 lampu taman blok A yang mati',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Amount requested (IDR)', example: 250000 })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: 'Expense category ID (must be an EXPENSE category). Defaults to PENGELUARAN-WARGA.',
    example: 'uuid-of-category',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: 'Date the expense occurred / is requested (YYYY-MM-DD)',
    example: '2026-07-17',
  })
  @IsNotEmpty({ message: 'Transaction date is required' })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'TRANSFER',
    enum: ['CASH', 'TRANSFER', 'CARD'],
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Resident ID of the pengurus (auto-resolved from the user if omitted)',
    example: 'uuid-of-resident',
  })
  @IsOptional()
  @IsString()
  residentId?: string;

  @ApiPropertyOptional({
    description:
      'IDs of proof-photo FileAttachments uploaded via /file-attachments/upload/multiple (entityType=EXPENSE_REQUEST). ' +
      'They will be linked to this request.',
    type: [String],
    example: ['uuid-of-file-1', 'uuid-of-file-2'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 proof photos allowed' })
  @IsString({ each: true })
  fileIds?: string[];
}
