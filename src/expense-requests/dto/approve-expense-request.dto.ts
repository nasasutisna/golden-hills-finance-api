import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveExpenseRequestDto {
  @ApiPropertyOptional({ description: 'Optional approval comment', example: 'Approved, silakan beli' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}
