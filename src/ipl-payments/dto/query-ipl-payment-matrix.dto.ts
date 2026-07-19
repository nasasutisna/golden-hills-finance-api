import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query params for the IPL payment matrix endpoint.
 * The matrix is a read-only unit x month view for a single year.
 */
export class QueryIplPaymentMatrixDto {
  @ApiPropertyOptional({
    description: 'Tahun matrix (default: tahun berjalan)',
    example: 2026,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter per house block (opsional)',
    example: 'uuid-of-block',
  })
  @IsOptional()
  @IsUUID()
  houseBlockId?: string;
}
