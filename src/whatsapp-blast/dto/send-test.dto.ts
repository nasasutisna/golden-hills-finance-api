import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Body for `POST /whatsapp-blast/send-test`.
 * Sends a single message to verify the WhatsApp connection (not logged as a blast).
 */
export class SendTestDto {
  @ApiProperty({
    description: 'Nomor tujuan dalam format apa pun (08xxx / +62xxx / 62xxx).',
    example: '081234567890',
  })
  @IsString()
  @MaxLength(30)
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Isi pesan. Jika kosong, dikirim pesan uji default.',
    example: 'Pesan uji dari Golden Hills Finance',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
