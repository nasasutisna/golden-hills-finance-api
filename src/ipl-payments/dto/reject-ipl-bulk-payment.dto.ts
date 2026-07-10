import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectIplBulkPaymentDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Payment proof unclear',
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  @MaxLength(500)
  rejectionReason: string;
}
