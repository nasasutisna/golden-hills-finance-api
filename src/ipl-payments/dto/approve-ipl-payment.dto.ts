import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveIplPaymentDto {
  @ApiProperty({
    description: 'Approval comments',
    example: 'Pembayaran telah diverifikasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comments?: string;
}
