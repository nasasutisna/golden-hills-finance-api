import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsUUID,
  ArrayMaxSize,
  ArrayUnique,
  IsOptional,
} from 'class-validator';

/**
 * Body for the "replace day" endpoint (PUT /security-schedules/day/:date).
 * The admin picks up to 2 guards per shift for a single day; the backend
 * wipes that date and recreates exactly these assignments (idempotent).
 *
 * The DB unique constraint @@unique([employeeId, specificDate]) means a guard
 * can hold at most one shift per day, so overlapping ids across pagi/malam are
 * rejected in the service (clearer message than a raw P2002).
 */
export class SetDaySecurityScheduleDto {
  @ApiProperty({
    description: 'Employee IDs assigned to the PAGI shift (max 2)',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2, { message: 'Maksimal 2 petugas shift Pagi' })
  @ArrayUnique({ message: 'Petugas shift Pagi tidak boleh ganda' })
  @IsUUID('all', { each: true, message: 'ID petugas Pagi tidak valid' })
  pagi?: string[];

  @ApiProperty({
    description: 'Employee IDs assigned to the MALAM shift (max 2)',
    type: [String],
    example: ['660e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2, { message: 'Maksimal 2 petugas shift Malam' })
  @ArrayUnique({ message: 'Petugas shift Malam tidak boleh ganda' })
  @IsUUID('all', { each: true, message: 'ID petugas Malam tidak valid' })
  malam?: string[];
}
