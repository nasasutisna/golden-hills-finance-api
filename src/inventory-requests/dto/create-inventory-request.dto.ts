import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateInventoryRequestDto {
  @ApiProperty({
    description: 'Request number',
    example: 'REQ-2024-001',
  })
  @IsNotEmpty({ message: 'Request number is required' })
  @IsString()
  requestNumber: string;

  @ApiProperty({
    description: 'Inventory item ID',
    example: 'uuid-of-inventory-item',
  })
  @IsNotEmpty({ message: 'Inventory item is required' })
  @IsString()
  inventoryId: string;

  @ApiProperty({
    description: 'Requested quantity',
    example: 50,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'Requested quantity is required' })
  @IsNumber()
  @Min(1)
  requestedQuantity: number;

  @ApiProperty({
    description: 'Request date',
    example: '2024-01-15',
  })
  @IsNotEmpty({ message: 'Request date is required' })
  @IsDateString()
  requestDate: string;

  @ApiProperty({
    description: 'Required date',
    example: '2024-01-20',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  requiredDate?: string;

  @ApiProperty({
    description: 'Purpose/reason for request',
    required: false,
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({
    description: 'Department requesting',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    description: 'Request priority',
    enum: RequestPriority,
    default: RequestPriority.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(RequestPriority, { message: 'Invalid request priority' })
  priority?: RequestPriority = RequestPriority.MEDIUM;

  @ApiProperty({
    description: 'Status',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Invalid status' })
  status?: RequestStatus = RequestStatus.PENDING;

  @ApiProperty({
    description: 'Notes or additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
