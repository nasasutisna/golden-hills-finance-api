import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectExpenseRequestDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Kwitansi tidak jelas, mohon upload ulang',
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Optional additional comments' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}
