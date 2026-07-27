import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryOptionsDto } from '../../common/dto/query-options.dto';

/**
 * Query params for `GET /whatsapp-blast/batches`.
 */
export class QueryBlastsDto extends QueryOptionsDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan status batch.',
    enum: ['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan tahun.', example: 2026 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({ description: 'Filter berdasarkan house block.', example: 'uuid' })
  @IsOptional()
  @IsString()
  houseBlockId?: string;

  @ApiPropertyOptional({ description: 'Hanya dry-run (true) atau blast nyata (false).' })
  @IsOptional()
  @IsIn(['true', 'false'])
  dryRun?: string;
}
