import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryIplBulkPaymentsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by resident ID',
    example: 'uuid-of-resident',
  })
  @IsOptional()
  @IsString()
  residentId?: string;
}
