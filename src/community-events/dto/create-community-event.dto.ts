import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventType {
  MEETING = 'MEETING',
  CELEBRATION = 'CELEBRATION',
  MAINTENANCE = 'MAINTENANCE',
  ACTIVITY = 'ACTIVITY',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  OTHER = 'OTHER',
}

export class CreateCommunityEventDto {
  @ApiProperty({
    description: 'Event title',
    example: 'Annual General Meeting',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Event title is required' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Event description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Event type',
    enum: EventType,
    example: EventType.MEETING,
  })
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, { message: 'Invalid event type' })
  eventType: EventType;

  @ApiProperty({
    description: 'Event start date and time',
    example: '2024-02-15T09:00:00Z',
  })
  @IsNotEmpty({ message: 'Event start date is required' })
  @IsDateString()
  eventStartDate: string;

  @ApiProperty({
    description: 'Event end date and time',
    example: '2024-02-15T11:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  eventEndDate?: string;

  @ApiProperty({
    description: 'Location',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({
    description: 'Expected participants',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedParticipants?: number;

  @ApiProperty({
    description: 'Budget',
    example: 5000000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiProperty({
    description: 'Event status',
    enum: EventStatus,
    default: EventStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventStatus, { message: 'Invalid event status' })
  status?: EventStatus = EventStatus.DRAFT;

  @ApiProperty({
    description: 'Is registration required',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  registrationRequired?: boolean = true;

  @ApiProperty({
    description: 'Registration deadline',
    example: '2024-02-10T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiProperty({
    description: 'Organizer name',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  organizer?: string;

  @ApiProperty({
    description: 'Contact information',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contact?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
