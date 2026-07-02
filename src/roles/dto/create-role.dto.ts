import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    example: 'ACCOUNTANT',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Role name is required' })
  @IsString()
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Accountant with financial management access',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Role permissions (JSON array)',
    example: ['invoices.manage', 'payments.manage', 'transactions.manage'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Permissions must be an array' })
  @IsString({ each: true })
  permissions?: string[];

  @ApiProperty({
    description: 'Is role active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
