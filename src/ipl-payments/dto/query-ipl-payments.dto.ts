import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryIplPaymentsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search keyword in paymentNumber',
    example: 'PAY202607',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by period ID',
    example: 'uuid-of-period',
  })
  @IsOptional()
  @IsString()
  periodId?: string;

  @ApiPropertyOptional({
    description: 'Filter by resident ID',
    example: 'uuid-of-resident',
  })
  @IsOptional()
  @IsString()
  residentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by house unit ID',
    example: 'uuid-of-unit',
  })
  @IsOptional()
  @IsString()
  houseUnitId?: string;

  @ApiPropertyOptional({
    description: 'Filter by house block ID',
    example: 'uuid-of-block',
  })
  @IsOptional()
  @IsString()
  houseBlockId?: string;
}
