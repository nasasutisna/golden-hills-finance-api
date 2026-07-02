"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseDecorators = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_dto_1 = require("../dto/response.dto");
class ApiResponseDecorators {
    static ok(options) {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiOkResponse)({
            description: options?.description || 'Successful operation',
            type: options?.type
                ? options.pagination
                    ? response_dto_1.ResponseWithPaginationDto
                    : response_dto_1.ResponseDto
                : response_dto_1.ResponseDto,
            isArray: options?.isArray,
        }));
    }
    static created(options) {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiCreatedResponse)({
            description: options?.description || 'Resource created successfully',
            type: options?.type ? response_dto_1.ResponseDto : response_dto_1.ResponseDto,
        }));
    }
    static badRequest() {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiBadRequestResponse)({
            description: 'Bad request - Invalid input data',
            type: response_dto_1.ResponseDto,
        }));
    }
    static unauthorized() {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiUnauthorizedResponse)({
            description: 'Unauthorized - Authentication required',
            type: response_dto_1.ResponseDto,
        }));
    }
    static forbidden() {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiForbiddenResponse)({
            description: 'Forbidden - Insufficient permissions',
            type: response_dto_1.ResponseDto,
        }));
    }
    static notFound() {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiNotFoundResponse)({
            description: 'Resource not found',
            type: response_dto_1.ResponseDto,
        }));
    }
    static conflict() {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiConflictResponse)({
            description: 'Conflict - Resource already exists',
            type: response_dto_1.ResponseDto,
        }));
    }
    static tooManyRequests() {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiTooManyRequestsResponse)({
            description: 'Too many requests - Rate limit exceeded',
            type: response_dto_1.ResponseDto,
        }));
    }
    static serverError() {
        return (0, common_1.applyDecorators)((0, swagger_1.ApiInternalServerErrorResponse)({
            description: 'Internal server error',
            type: response_dto_1.ResponseDto,
        }));
    }
    static standard() {
        return (0, common_1.applyDecorators)(this.badRequest(), this.unauthorized(), this.forbidden(), this.notFound(), this.conflict(), this.tooManyRequests(), this.serverError());
    }
}
exports.ApiResponseDecorators = ApiResponseDecorators;
//# sourceMappingURL=http-response.decorator.js.map