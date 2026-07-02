import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, MaxLength, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryInventoriesDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by item type',
    required: false,
  })
  @IsOptional()
  @IsString()
  itemType?: string;

  @ApiProperty({
    description: 'Filter by unit',
    required: false,
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    description: 'Filter by location',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Search in item code, name, or description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by low stock (stock below minimum)',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  lowStock?: boolean;
}
