import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ResponseDto } from '../dto/response.dto';

@Catch(Prisma.PrismaClientKnownRequestError)
export class QueryErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryErrorFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = this.getStatus(exception.code);
    const message = this.getMessage(exception);
    const errorResponse = new ResponseDto(status, message, null, [exception.message]);
    errorResponse.path = request.url;
    errorResponse.timestamp = new Date().toISOString();

    this.logger.error(
      `Prisma Error: ${exception.code} - ${exception.message} - Meta: ${JSON.stringify(exception.meta)}`,
    );

    response.status(status).json(errorResponse);
  }

  private getStatus(code: string): number {
    switch (code) {
      case 'P2002':
        return 409; // Conflict - Unique constraint violation
      case 'P2025':
        return 404; // Not Found - Record not found
      case 'P2003':
        return 400; // Bad Request - Foreign key constraint violation
      case 'P2004':
        return 400; // Bad Request - Constraint violation
      case 'P2006':
        return 400; // Bad Request - Invalid value
      case 'P2011':
        return 400; // Bad Request - Null constraint violation
      case 'P2014':
        return 400; // Bad Request - Required relation violation
      case 'P2015':
        return 404; // Not Found - Related record not found
      case 'P2016':
        return 400; // Bad Request - Query interpretation error
      case 'P2017':
        return 400; // Bad Request - Relation violation
      case 'P2018':
        return 400; // Bad Request - Required connected records
      case 'P2019':
        return 400; // Bad Request - Input error
      case 'P2020':
        return 400; // Bad Request - Value out of range
      case 'P2021':
        return 400; // Bad Request - Table does not exist
      case 'P2022':
        return 400; // Bad Request - Column does not exist
      case 'P2023':
        return 400; // Bad Request - Inconsistent column data
      case 'P2024':
        return 400; // Bad Request - Connection pool timeout
      default:
        return 500; // Internal Server Error
    }
  }

  private getMessage(exception: Prisma.PrismaClientKnownRequestError): string {
    switch (exception.code) {
      case 'P2002':
        const constraint = exception.meta?.target as string[];
        return `A record with this ${constraint?.join(', ')} already exists`;
      case 'P2025':
        return 'Record not found';
      case 'P2003':
        return 'Foreign key constraint violation';
      case 'P2004':
        return 'Database constraint violation';
      case 'P2006':
        return 'Invalid value provided';
      case 'P2011':
        return 'Null constraint violation';
      case 'P2014':
        return 'Required relation violation';
      case 'P2015':
        return 'Related record not found';
      case 'P2016':
        return 'Query interpretation error';
      case 'P2017':
        return 'Relation fields violation';
      case 'P2018':
        return 'Required connected records not found';
      case 'P2019':
        return 'Input validation error';
      case 'P2020':
        return 'Value out of range';
      case 'P2021':
        return 'Table does not exist';
      case 'P2022':
        return 'Column does not exist';
      case 'P2023':
        return 'Inconsistent column data';
      case 'P2024':
        return 'Connection pool timeout';
      default:
        return 'Database operation failed';
    }
  }
}
