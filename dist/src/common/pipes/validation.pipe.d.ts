import { ValidationError, ValidationPipe as NestValidationPipe, ValidationPipeOptions } from '@nestjs/common';
export declare class ValidationPipe extends NestValidationPipe {
    constructor(options?: ValidationPipeOptions);
    protected flattenValidationErrors(errors: ValidationError[]): string[];
    private mapErrorsToMessages;
}
