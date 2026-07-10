import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateFileAttachmentDto {
  @ApiProperty({
    description: 'Entity type (e.g., RESIDENT, EMPLOYEE, INVOICE)',
    example: 'RESIDENT',
  })
  @IsNotEmpty({ message: 'Entity type is required' })
  @IsString()
  entityType: string;

  @ApiProperty({
    description: 'Entity ID',
    example: 'uuid-of-entity',
    required: false,
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({
    description: 'File name',
    example: 'document.pdf',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'File name is required' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'File path',
    example: '/uploads/document.pdf',
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'File path is required' })
  @IsString()
  @MaxLength(500)
  filePath: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsNotEmpty({ message: 'File size is required' })
  fileSize: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'MIME type is required' })
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiProperty({
    description: 'File category',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiProperty({
    description: 'File description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
