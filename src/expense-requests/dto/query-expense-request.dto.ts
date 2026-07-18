import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryExpenseRequestDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search keyword in requestNumber / title', example: 'lampu' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', example: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by requester (user) ID' })
  @IsOptional()
  @IsString()
  requestedById?: string;

  @ApiPropertyOptional({ description: 'Filter by resident ID' })
  @IsOptional()
  @IsString()
  residentId?: string;

  @ApiPropertyOptional({ description: 'Filter from this date (inclusive)', example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter up to this date (inclusive)', example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
