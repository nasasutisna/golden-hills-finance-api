import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveIplBulkPaymentDto {
  @ApiProperty({
    description: 'Approval comments',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comments?: string;
}
