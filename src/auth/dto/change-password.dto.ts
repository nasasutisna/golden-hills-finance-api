import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../common/validators';

/**
 * Self-service password change. The caller is the authenticated user, so the
 * current password must be supplied and verified — unlike the admin-only
 * `ResetPasswordDto` which sets a password without proof of ownership.
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Password saat ini (untuk verifikasi kepemilikan akun).',
    example: 'OldSecure@Pass123',
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description:
      'Password baru. Minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus.',
    example: 'NewSecure@Pass123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsStrongPassword()
  newPassword: string;
}
