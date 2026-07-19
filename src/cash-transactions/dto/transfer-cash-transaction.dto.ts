import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CASH_ACCOUNT_CODES,
  CashAccountCode,
} from '../../common/constants/cash-accounts';

const ACCOUNT_CODE_VALUES = Object.values(CASH_ACCOUNT_CODES);

export class TransferCashTransactionDto {
  @ApiProperty({
    description: 'Source cash account code (money leaves this Kas)',
    example: 'KAS_IPL',
    enum: ACCOUNT_CODE_VALUES,
  })
  @IsNotEmpty({ message: 'Source account is required' })
  @IsString()
  @IsIn(ACCOUNT_CODE_VALUES, { message: 'Invalid source account code' })
  fromAccountCode: CashAccountCode;

  @ApiProperty({
    description: 'Destination cash account code (money lands in this Kas)',
    example: 'KAS_WARGA',
    enum: ACCOUNT_CODE_VALUES,
  })
  @IsNotEmpty({ message: 'Destination account is required' })
  @IsString()
  @IsIn(ACCOUNT_CODE_VALUES, { message: 'Invalid destination account code' })
  toAccountCode: CashAccountCode;

  @ApiProperty({ description: 'Amount to transfer (IDR)', example: 500000 })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Transfer date',
    example: '2026-07-19',
  })
  @IsNotEmpty({ message: 'Transaction date is required' })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({
    description: 'Description / note for the transfer',
    example: 'Transfer kas untuk kegiatan 17 Agustusan',
  })
  @IsString()
  @MaxLength(500)
  description?: string;
}
