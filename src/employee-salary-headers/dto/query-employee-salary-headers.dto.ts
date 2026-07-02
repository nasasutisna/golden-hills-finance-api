import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryEmployeeSalaryHeadersDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by status',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Filter by employee ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({
    description: 'Filter by pay period (YYYY-MM)',
    required: false,
  })
  @IsOptional()
  @IsString()
  payPeriod?: string;

  @ApiProperty({
    description: 'Filter by payment date from',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paymentDateFrom?: string;

  @ApiProperty({
    description: 'Filter by payment date to',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paymentDateTo?: string;

  @ApiProperty({
    description: 'Search by payroll number',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by locked status',
    required: false,
  })
  @IsOptional()
  locked?: boolean;
}
