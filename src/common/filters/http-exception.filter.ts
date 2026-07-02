import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto/response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errors =
      exception instanceof HttpException
        ? this.extractErrors(exception)
        : ['An unexpected error occurred'];

    // Log error details
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    const errorResponse = new ResponseDto(status, message, null, errors);
    errorResponse.path = request.url;
    errorResponse.timestamp = new Date().toISOString();

    response.status(status).json(errorResponse);
  }

  private extractErrors(exception: HttpException): string[] {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return [exceptionResponse];
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const response = exceptionResponse as Record<string, any>;

      if (Array.isArray(response.message)) {
        return response.message;
      }

      if (response.message) {
        return [response.message];
      }

      if (response.error) {
        return [response.error];
      }
    }

    return [exception.message];
  }
}
