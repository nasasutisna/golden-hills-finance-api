import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  Matches,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export enum ShiftEnum {
  PAGI = 'PAGI',
  MALAM = 'MALAM',
}

export class CreateSecurityScheduleDto {
  @ApiProperty({
    description: 'Employee ID (security guard) assigned to this slot',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'Petugas security is required' })
  @IsString()
  employeeId: string;

  @ApiProperty({
    description: 'Specific date of the shift (ISO date YYYY-MM-DD)',
    example: '2026-09-01',
  })
  @IsNotEmpty({ message: 'Tanggal is required' })
  @IsDateString({}, { message: 'Tanggal must be a valid ISO date' })
  specificDate: string;

  @ApiProperty({
    description: 'Shift type',
    example: 'PAGI',
    enum: ShiftEnum,
  })
  @IsEnum(ShiftEnum, { message: 'Shift must be PAGI or MALAM' })
  shift: ShiftEnum;

  @ApiProperty({
    description: 'Start time (HH:mm)',
    example: '08:00',
  })
  @IsNotEmpty({ message: 'Jam mulai is required' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Jam mulai must be in HH:mm format' })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:mm)',
    example: '20:00',
  })
  @IsNotEmpty({ message: 'Jam selesai is required' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Jam selesai must be in HH:mm format' })
  endTime: string;

  @ApiProperty({
    description: 'Is schedule active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
