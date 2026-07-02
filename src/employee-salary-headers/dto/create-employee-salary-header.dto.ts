import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export class CreateEmployeeSalaryHeaderDto {
  @ApiProperty({
    description: 'Payroll number',
    example: 'PAY-2024-01',
  })
  @IsNotEmpty({ message: 'Payroll number is required' })
  @IsString()
  payrollNumber: string;

  @ApiProperty({
    description: 'Employee ID',
    example: 'uuid-of-employee',
  })
  @IsNotEmpty({ message: 'Employee is required' })
  @IsString()
  employeeId: string;

  @ApiProperty({
    description: 'Pay period (month and year)',
    example: '2024-01',
  })
  @IsNotEmpty({ message: 'Pay period is required' })
  @IsString()
  payPeriod: string;

  @ApiProperty({
    description: 'Payment date',
    example: '2024-01-25',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({
    description: 'Basic salary',
    example: 5000000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @ApiProperty({
    description: 'Total allowances',
    example: 1000000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAllowances?: number;

  @ApiProperty({
    description: 'Total deductions',
    example: 500000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDeductions?: number;

  @ApiProperty({
    description: 'Net salary',
    example: 5500000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  netSalary?: number;

  @ApiProperty({
    description: 'Payroll status',
    enum: PayrollStatus,
    default: PayrollStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(PayrollStatus, { message: 'Invalid payroll status' })
  status?: PayrollStatus = PayrollStatus.DRAFT;

  @ApiProperty({
    description: 'Work days in period',
    example: 22,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  workDays?: number;

  @ApiProperty({
    description: 'Actual days worked',
    example: 22,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  daysWorked?: number;

  @ApiProperty({
    description: 'Overtime hours',
    example: 5,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @ApiProperty({
    description: 'Leave days taken',
    example: 0,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leaveDays?: number;

  @ApiProperty({
    description: 'Is locked (no further modifications)',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  locked?: boolean = false;

  @ApiProperty({
    description: 'Notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
