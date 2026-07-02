import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ResponseDto, ResponseWithPaginationDto } from '../dto/response.dto';

interface ApiResponseOptions {
  type?: Type<any>;
  description?: string;
  isArray?: boolean;
  pagination?: boolean;
}

export class ApiResponseDecorators {
  static ok(options?: ApiResponseOptions) {
    return applyDecorators(
      ApiOkResponse({
        description: options?.description || 'Successful operation',
        type: options?.type
          ? options.pagination
            ? ResponseWithPaginationDto
            : ResponseDto
          : ResponseDto,
        isArray: options?.isArray,
      }),
    );
  }

  static created(options?: ApiResponseOptions) {
    return applyDecorators(
      ApiCreatedResponse({
        description: options?.description || 'Resource created successfully',
        type: options?.type ? ResponseDto : ResponseDto,
      }),
    );
  }

  static badRequest() {
    return applyDecorators(
      ApiBadRequestResponse({
        description: 'Bad request - Invalid input data',
        type: ResponseDto,
      }),
    );
  }

  static unauthorized() {
    return applyDecorators(
      ApiUnauthorizedResponse({
        description: 'Unauthorized - Authentication required',
        type: ResponseDto,
      }),
    );
  }

  static forbidden() {
    return applyDecorators(
      ApiForbiddenResponse({
        description: 'Forbidden - Insufficient permissions',
        type: ResponseDto,
      }),
    );
  }

  static notFound() {
    return applyDecorators(
      ApiNotFoundResponse({
        description: 'Resource not found',
        type: ResponseDto,
      }),
    );
  }

  static conflict() {
    return applyDecorators(
      ApiConflictResponse({
        description: 'Conflict - Resource already exists',
        type: ResponseDto,
      }),
    );
  }

  static tooManyRequests() {
    return applyDecorators(
      ApiTooManyRequestsResponse({
        description: 'Too many requests - Rate limit exceeded',
        type: ResponseDto,
      }),
    );
  }

  static serverError() {
    return applyDecorators(
      ApiInternalServerErrorResponse({
        description: 'Internal server error',
        type: ResponseDto,
      }),
    );
  }

  static standard() {
    return applyDecorators(
      this.badRequest(),
      this.unauthorized(),
      this.forbidden(),
      this.notFound(),
      this.conflict(),
      this.tooManyRequests(),
      this.serverError(),
    );
  }
}
