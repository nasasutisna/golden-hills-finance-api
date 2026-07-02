import {
  ValidationError,
  ValidationPipe as NestValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

export class ValidationPipe extends NestValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      ...options,
    });
  }

  protected flattenValidationErrors(errors: ValidationError[]): string[] {
    return this.mapErrorsToMessages(errors);
  }

  private mapErrorsToMessages(errors: ValidationError[], parentPath = ''): string[] {
    const messages: string[] = [];

    errors.forEach((error) => {
      const path = parentPath ? `${parentPath}.${error.property}` : error.property;

      if (error.constraints) {
        Object.values(error.constraints).forEach((constraint) => {
          messages.push(`${path}: ${constraint}`);
        });
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.mapErrorsToMessages(error.children, path));
      }
    });

    return messages;
  }
}
