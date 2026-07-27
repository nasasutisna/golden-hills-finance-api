import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Body for `POST /whatsapp-blast/blast`.
 *
 * The target list is always derived from the IPL delinquency computation
 * (≥ 3 trailing unpaid months). `dryRun` returns the exact recipients + message
 * preview without sending anything.
 */
export class TriggerBlastDto {
  @ApiPropertyOptional({
    description: 'Tahun matrix (default: tahun berjalan). Sama dengan endpoint delinquent.',
    example: 2026,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    description: 'Batasi ke satu house block (opsional).',
    example: 'uuid-of-block',
  })
  @IsOptional()
  @IsString()
  houseBlockId?: string;

  @ApiPropertyOptional({
    description:
      'Jika true: hitung target + pesan tanpa mengirim apa pun (simulasi). Default false.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Catatan internal untuk batch ini (opsional).',
    example: 'Blast awal bulan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
