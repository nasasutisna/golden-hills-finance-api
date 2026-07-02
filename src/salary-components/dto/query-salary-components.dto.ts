import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QuerySalaryComponentsDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by component type',
    required: false,
  })
  @IsOptional()
  @IsString()
  componentType?: string;

  @ApiProperty({
    description: 'Filter by calculation type',
    required: false,
  })
  @IsOptional()
  @IsString()
  calculationType?: string;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by tax subject',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isTaxSubject?: boolean;

  @ApiProperty({
    description: 'Search by code, name, or description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
