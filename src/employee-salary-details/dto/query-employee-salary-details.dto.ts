import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryEmployeeSalaryDetailsDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by salary header ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  salaryHeaderId?: string;

  @ApiProperty({
    description: 'Filter by salary component ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  salaryComponentId?: string;

  @ApiProperty({
    description: 'Filter by manual override',
    required: false,
  })
  @IsOptional()
  manualOverride?: boolean;
}
