import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsDateString,
  IsEnum,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { PaymentMethod, IplPaymentStatus } from './enums';
import { CreateIplPaymentDto } from './create-ipl-payment.dto';

export class UpdateIplPaymentDto extends PartialType(CreateIplPaymentDto) {
  @ApiProperty({
    description: 'Period ID',
    example: 'uuid-of-period',
    required: false,
  })
  @IsOptional()
  @IsString()
  periodId?: string;

  @ApiProperty({
    description: 'Resident ID',
    example: 'uuid-of-resident',
    required: false,
  })
  @IsOptional()
  @IsString()
  residentId?: string;

  @ApiProperty({
    description: 'Payment date',
    example: '2026-07-09',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Reference number',
    example: 'REF123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({
    description: 'Payment status',
    enum: IplPaymentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(IplPaymentStatus)
  status?: IplPaymentStatus;
}
