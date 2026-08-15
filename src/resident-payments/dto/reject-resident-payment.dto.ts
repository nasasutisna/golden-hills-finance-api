import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectResidentPaymentDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Bukti transfer tidak jelas, mohon kirim ulang',
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  @MaxLength(1000)
  reason: string;
}
