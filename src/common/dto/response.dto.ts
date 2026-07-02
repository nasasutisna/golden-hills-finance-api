import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty({
    description: 'Status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Success',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    nullable: true,
  })
  data?: T;

  @ApiProperty({
    description: 'Errors if any',
    nullable: true,
    isArray: true,
  })
  errors?: string[];

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path',
    example: '/api/v1/users',
  })
  path: string;

  constructor(
    statusCode: number,
    message: string,
    data?: T,
    errors?: string[],
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
    this.path = '';
  }
}

export class ResponseWithPaginationDto<T> {
  @ApiProperty({
    description: 'Status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Success',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: T[];

  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path',
    example: '/api/v1/users',
  })
  path: string;
}
