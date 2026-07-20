import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';

/**
 * Simple flat-amount payroll: one number (gaji bersih) per employee per period.
 * On create, the header is set to PAID and an IPL EXPENSE CashTransaction is
 * posted in the same transaction (category GAJI → Kas IPL).
 */
export class CreateSimplePayrollDto {
  @ApiProperty({ description: 'Employee ID', example: 'uuid-of-employee' })
  @IsNotEmpty({ message: 'Karyawan wajib dipilih' })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Pay period (YYYY-MM)', example: '2026-07' })
  @IsNotEmpty({ message: 'Periode wajib diisi' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Periode harus dalam format YYYY-MM (contoh: 2026-07)',
  })
  payPeriod: string;

  @ApiProperty({
    description: 'Net salary dibayar (gaji bersih, satu angka)',
    example: 3500000,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Jumlah gaji wajib diisi' })
  @IsNumber()
  @Min(0, { message: 'Jumlah gaji tidak boleh negatif' })
  netSalary: number;

  @ApiProperty({ description: 'Tanggal pembayaran', example: '2026-07-25', required: false })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({ description: 'Keterangan', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
