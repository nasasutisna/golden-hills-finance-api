import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsStrongPassword } from '../../common/validators';

/**
 * Step 1 of the register flow.
 *
 * The client supplies their house unit + the WhatsApp number registered to that
 * unit. The backend resolves the matching resident; if the unit already has an
 * account it returns "akun sudah terdaftar", otherwise it sends a 6-digit OTP
 * to that number and returns a `registerToken`.
 *
 * Unlike forgot-password, register is an onboarding flow and intentionally
 * distinguishes "unit not found" / "phone mismatch" / "already registered" so
 * the user knows how to proceed.
 */
export class RegisterRequestDto {
  @ApiProperty({
    description: 'Nomor unit rumah yang terdaftar (mis. "A-101").',
    example: 'A-101',
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
 * Step 2 of the register flow.
 *
 * The client returns the `registerToken` from step 1 together with the OTP they
 * received via WhatsApp and their chosen password. The backend verifies the
 * OTP, creates the User (auto-derived identity from the resident), links the
 * resident, and returns auth tokens (auto-login).
 */
export class RegisterCompleteDto {
  @ApiProperty({ description: 'Token dari langkah permintaan OTP.' })
  @IsNotEmpty({ message: 'Register token wajib diisi' })
  @IsString()
  registerToken: string;

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
