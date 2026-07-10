import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectIplPaymentDto {
  @ApiProperty({
    description: 'Rejection reason (alasan penolakan)',
    example: 'Bukti transfer tidak valid',
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  @MaxLength(500)
  rejectionReason: string;
}
