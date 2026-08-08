import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsStrongPassword } from '../../common/validators';

/**
 * Step 1 of the forgot-password flow.
 *
 * The client supplies their house unit + the phone number registered to that
 * unit. The backend resolves the matching resident/user, and — if found and
 * the WhatsApp client is up — sends a 6-digit OTP to that number. The response
 * is intentionally identical whether or not the account exists, to prevent
 * enumeration.
 */
export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'Nomor unit rumah yang terdaftar (mis. "B-12").',
    example: 'B-12',
  })
  @IsNotEmpty({ message: 'Nomor unit rumah wajib diisi' })
  @IsString()
  @MaxLength(30)
  unitNumber: string;

  @ApiProperty({
    description:
      'Nomor WhatsApp terdaftar pada unit tersebut (08xxx / +628xxx / 628xxx).',
    example: '081234567890',
  })
  @IsNotEmpty({ message: 'Nomor WhatsApp wajib diisi' })
  @IsString()
  @MaxLength(30)
  phoneNumber: string;
}

/**
 * Step 2 of the forgot-password flow.
 *
 * The client returns the `resetToken` from step 1 together with the OTP they
 * received via WhatsApp and their chosen new password. The token alone is
 * useless without the OTP, so handing it to the client is safe.
 */
export class ResetPasswordDto {
  @ApiProperty({ description: 'Token dari langkah permintaan OTP.' })
  @IsNotEmpty({ message: 'Reset token wajib diisi' })
  @IsString()
  resetToken: string;

  @ApiProperty({
    description: 'Kode OTP 6 digit yang diterima via WhatsApp.',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Kode OTP wajib diisi' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kode OTP harus 6 digit angka' })
  otp: string;

  @ApiProperty({
    description:
      'Password baru. Minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus.',
    example: 'NewSecure@Pass123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
