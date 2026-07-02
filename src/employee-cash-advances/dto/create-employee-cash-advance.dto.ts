import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum AdvanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  REPAID = 'REPAID',
  PARTIALLY_REPAID = 'PARTIALLY_REPAID',
  CANCELLED = 'CANCELLED',
}

export class CreateEmployeeCashAdvanceDto {
  @ApiProperty({
    description: 'Advance number',
    example: 'ADV-2024-001',
  })
  @IsNotEmpty({ message: 'Advance number is required' })
  @IsString()
  advanceNumber: string;

  @ApiProperty({
    description: 'Employee ID',
    example: 'uuid-of-employee',
  })
  @IsNotEmpty({ message: 'Employee is required' })
  @IsString()
  employeeId: string;

  @ApiProperty({
    description: 'Request date',
    example: '2024-01-15',
  })
  @IsNotEmpty({ message: 'Request date is required' })
  @IsDateString()
  requestDate: string;

  @ApiProperty({
    description: 'Amount requested',
    example: 500000,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Purpose/reason for advance',
    example: 'Medical emergency',
  })
  @IsNotEmpty({ message: 'Purpose is required' })
  @IsString()
  purpose: string;

  @ApiProperty({
    description: 'Expected repayment date',
    example: '2024-02-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expectedRepaymentDate?: string;

  @ApiProperty({
    description: 'Number of installments',
    example: 2,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  installmentCount?: number;

  @ApiProperty({
    description: 'Advance status',
    enum: AdvanceStatus,
    default: AdvanceStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdvanceStatus, { message: 'Invalid advance status' })
  status?: AdvanceStatus = AdvanceStatus.PENDING;

  @ApiProperty({
    description: 'Notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
