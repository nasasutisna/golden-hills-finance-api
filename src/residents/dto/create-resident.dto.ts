import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export enum OwnershipType {
  OWNER = 'OWNER',
  RENTER = 'RENTER',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export class CreateResidentDto {
  @ApiProperty({
    description: 'Resident code (unique identifier)',
    example: 'RES001',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Resident code is required' })
  @IsString()
  @MaxLength(20, { message: 'Resident code must not exceed 20 characters' })
  residentCode: string;

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
    description: 'Email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+6281234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Alternate phone number',
    example: '+6281234567891',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  alternatePhone?: string;

  @ApiProperty({
    description: 'Identity number (KTP/Passport)',
    example: '1234567890123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Identity number must not exceed 50 characters' })
  identityNumber?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1985-05-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Invalid gender' })
  gender?: Gender;

  @ApiProperty({
    description: 'Occupation',
    example: 'Engineer',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiProperty({
    description: 'Marital status',
    enum: MaritalStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(MaritalStatus, { message: 'Invalid marital status' })
  maritalStatus?: MaritalStatus;

  @ApiProperty({
    description: 'Address',
    example: 'Jalan Example No. 123',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'Jane Doe',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContact?: string;

  @ApiProperty({
    description: 'Emergency phone number',
    example: '+6281234567892',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  emergencyPhone?: string;

  @ApiProperty({
    description: 'House block ID',
    example: 'uuid-of-house-block',
  })
  @IsNotEmpty({ message: 'House block is required' })
  @IsString()
  houseBlockId: string;

  @ApiProperty({
    description: 'Unit number',
    example: 'A-101',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Unit number is required' })
  @IsString()
  @MaxLength(20)
  unitNumber: string;

  @ApiProperty({
    description: 'Move in date',
    example: '2022-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @ApiProperty({
    description: 'Move out date',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  moveOutDate?: string;

  @ApiProperty({
    description: 'Ownership type',
    enum: OwnershipType,
    default: OwnershipType.OWNER,
  })
  @IsNotEmpty({ message: 'Ownership type is required' })
  @IsEnum(OwnershipType, { message: 'Invalid ownership type' })
  ownershipType: OwnershipType;

  @ApiProperty({
    description: 'Is resident active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
