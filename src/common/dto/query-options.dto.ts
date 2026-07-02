import { IsOptional, IsString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export class QueryOptionsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search keyword',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Fields to search in (comma-separated)',
    example: 'firstName,lastName,email',
  })
  @IsOptional()
  @IsString()
  searchFields?: string;

  @ApiPropertyOptional({
    description: 'Filter conditions (JSON string)',
    example: '{"status":"ACTIVE","department":"Finance"}',
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Fields to include (comma-separated)',
    example: 'id,name,email',
  })
  @IsOptional()
  @IsString()
  fields?: string;
}

export interface QueryOptions {
  pagination: {
    page: number;
    limit: number;
    skip: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  search?: {
    keyword: string;
    fields: string[];
  };
  filters?: Record<string, any>;
  fields?: string[];
}
