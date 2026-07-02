import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryInventoryRequestsDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by status',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Filter by priority',
    required: false,
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({
    description: 'Filter by department',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    description: 'Filter by inventory item ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  inventoryId?: string;

  @ApiProperty({
    description: 'Filter by date from',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter by date to',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: 'Search by request number or purpose',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
