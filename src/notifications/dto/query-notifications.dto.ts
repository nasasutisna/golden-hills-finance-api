import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryNotificationsDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by user ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Filter by type',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Filter by priority',
    required: false,
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({
    description: 'Filter by read status',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiProperty({
    description: 'Filter by action type',
    required: false,
  })
  @IsOptional()
  @IsString()
  actionType?: string;

  @ApiProperty({
    description: 'Search by title or message',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
