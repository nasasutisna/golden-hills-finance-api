import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';

export enum ApprovalAction {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export class CreateApprovalHistoryDto {
  @ApiProperty({
    description: 'Entity type (e.g., CashTransaction, InventoryRequest)',
    example: 'CashTransaction',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Entity type is required' })
  @IsString()
  @MaxLength(50)
  entityType: string;

  @ApiProperty({
    description: 'Entity ID',
    example: 'uuid-of-entity',
  })
  @IsNotEmpty({ message: 'Entity ID is required' })
  @IsString()
  entityId: string;

  @ApiProperty({
    description: 'Action performed',
    enum: ApprovalAction,
  })
  @IsNotEmpty({ message: 'Action is required' })
  @IsEnum(ApprovalAction, { message: 'Invalid action' })
  action: ApprovalAction;

  @ApiProperty({
    description: 'Previous status',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  fromStatus?: string;

  @ApiProperty({
    description: 'New status',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'To status is required' })
  @IsString()
  @MaxLength(20)
  toStatus: string;

  @ApiProperty({
    description: 'Comments or notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;

  @ApiProperty({
    description: 'Creator user ID',
    example: 'uuid-of-user',
  })
  @IsNotEmpty({ message: 'Created by is required' })
  @IsString()
  createdBy: string;

  @ApiProperty({
    description: 'Approver user ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiProperty({
    description: 'IP address',
    required: false,
    maxLength: 45,
  })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
