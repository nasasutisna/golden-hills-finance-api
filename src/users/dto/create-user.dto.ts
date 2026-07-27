import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { IsValidEmail, IsStrongPassword, IsIndonesianPhone } from '../../common/validators';

export type PasswordMode = 'manual' | 'generate';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsValidEmail()
  email: string;

  @ApiPropertyOptional({
    description:
      'Password manual (wajib jika passwordMode = "manual"). Diabaikan jika passwordMode = "generate".',
    example: 'Secure@Pass123',
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
    description:
      'Kirim kredensial (password) ke nomor WhatsApp warga setelah user dibuat.',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendViaWhatsapp?: boolean;

  @ApiPropertyOptional({
    description:
      'ID warga (resident) yang akan di-link ke akun ini. Relasi 1:1 via Resident.userId.',
    example: 'resident-uuid',
  })
  @IsOptional()
  @IsString()
  residentId?: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName: string;

  @ApiProperty({
    description: 'Phone number (format Indonesia: 08xxx / +628xxx / 628xxx)',
    example: '081234567890',
    required: false,
  })
  @IsOptional()
  @IsIndonesianPhone()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Role ID',
    example: 'role-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiProperty({
    description: 'Is user active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Is email verified',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    required: false,
  })
  @IsOptional()
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'Refresh token (internal use)',
    required: false,
  })
  @IsOptional()
  refreshToken?: string | null;

  @ApiProperty({
    description: 'Refresh token expiry (internal use)',
    required: false,
  })
  @IsOptional()
  refreshTokenExpiry?: Date | null;
}
