import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { IsStrongPassword } from '../../common/validators';
import { PasswordMode } from './create-user.dto';

export class ResetPasswordDto {
  @ApiPropertyOptional({
    description:
      'Password baru manual (wajib jika passwordMode = "manual"). Diabaikan jika passwordMode = "generate".',
    example: 'NewSecure@Pass123',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsStrongPassword()
  password?: string;

  @ApiPropertyOptional({
    description: 'Sumber password: "manual" (default) atau "generate".',
    example: 'generate',
    default: 'manual',
  })
  @IsOptional()
  @IsIn(['manual', 'generate'], {
    message: 'passwordMode must be "manual" or "generate"',
  })
  passwordMode?: PasswordMode;

  @ApiPropertyOptional({
    description: 'Kirim password baru ke nomor WhatsApp warga.',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendViaWhatsapp?: boolean;
}
