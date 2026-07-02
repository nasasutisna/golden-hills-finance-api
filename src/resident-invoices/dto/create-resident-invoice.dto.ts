import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export class CreateResidentInvoiceDto {
  @ApiProperty({
    description: 'Resident ID',
    example: 'uuid-of-resident',
  })
  @IsNotEmpty({ message: 'Resident is required' })
  @IsString()
  residentId: string;

  @ApiProperty({
    description: 'Fee Type ID',
    example: 'uuid-of-fee-type',
  })
  @IsNotEmpty({ message: 'Fee type is required' })
  @IsString()
  feeTypeId: string;

  @ApiProperty({
    description: 'Invoice date',
    example: '2024-01-01',
  })
  @IsNotEmpty({ message: 'Invoice date is required' })
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({
    description: 'Due date',
    example: '2024-01-31',
  })
  @IsNotEmpty({ message: 'Due date is required' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    description: 'Period start date',
    example: '2024-01-01',
  })
  @IsNotEmpty({ message: 'Period start date is required' })
  @IsDateString()
  periodStartDate: string;

  @ApiProperty({
    description: 'Period end date',
    example: '2024-01-31',
  })
  @IsNotEmpty({ message: 'Period end date is required' })
  @IsDateString()
  periodEndDate: string;

  @ApiProperty({
    description: 'Subtotal amount',
    example: 500000,
  })
  @IsNotEmpty({ message: 'Subtotal is required' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxAmount?: number;

  @ApiProperty({
    description: 'Discount amount',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'Created by (user ID)',
    example: 'uuid-of-user',
  })
  @IsNotEmpty({ message: 'Creator is required' })
  @IsString()
  createdBy: string;
}
