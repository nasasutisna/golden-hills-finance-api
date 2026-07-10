import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryIplPeriodsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search keyword in periodCode or periodName',
    example: 'Juli 2026',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by month',
    example: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({
    description: 'Filter by year',
    example: 2026,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year?: number;
}
