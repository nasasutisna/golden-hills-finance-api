import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to receive notification',
    example: 'uuid-of-user',
  })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Payment Received',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your payment of Rp 500.000 has been received',
  })
  @IsNotEmpty({ message: 'Message is required' })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    default: NotificationType.INFO,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationType, { message: 'Invalid notification type' })
  type?: NotificationType = NotificationType.INFO;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationPriority, { message: 'Invalid notification priority' })
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @ApiProperty({
    description: 'Action type (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  actionType?: string;

  @ApiProperty({
    description: 'Action ID (reference to related entity)',
    required: false,
  })
  @IsOptional()
  @IsString()
  actionId?: string;

  @ApiProperty({
    description: 'Is read',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  isRead?: boolean = false;

  @ApiProperty({
    description: 'Expiration date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
