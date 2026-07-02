import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { IsValidEmail } from '../../common/validators';

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  PROBATION = 'PROBATION',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
}

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Employee code (unique identifier)',
    example: 'EMP001',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Employee code is required' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  employeeCode: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsValidEmail()
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
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identityNumber?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'MALE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'], { message: 'Invalid gender' })
  gender?: string;

  @ApiProperty({
    description: 'Marital status',
    example: 'SINGLE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'])
  maritalStatus?: string;

  @ApiProperty({
    description: 'Address',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    description: 'City',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    description: 'Province',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiProperty({
    description: 'Postal code',
    maxLength: 10,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContact?: string;

  @ApiProperty({
    description: 'Emergency phone',
    example: '+6281234567892',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  emergencyPhone?: string;

  @ApiProperty({
    description: 'Position ID',
    example: 'uuid-of-position',
  })
  @IsNotEmpty({ message: 'Position is required' })
  @IsString()
  positionId: string;

  @ApiProperty({
    description: 'Hire date',
    example: '2023-01-15',
  })
  @IsNotEmpty({ message: 'Hire date is required' })
  @IsDateString()
  hireDate: string;

  @ApiProperty({
    description: 'Probation end date',
    example: '2023-04-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  probationEndDate?: string;

  @ApiProperty({
    description: 'Employment status',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  @IsNotEmpty({ message: 'Employment status is required' })
  @IsEnum(EmploymentStatus, { message: 'Invalid employment status' })
  employmentStatus: EmploymentStatus;

  @ApiProperty({
    description: 'Bank name',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @ApiProperty({
    description: 'Bank account number',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccountNumber?: string;

  @ApiProperty({
    description: 'Bank account name',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountName?: string;

  @ApiProperty({
    description: 'Tax ID',
    maxLength: 30,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  taxId?: string;

  @ApiProperty({
    description: 'Photo URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Is employee active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean = true;
}
