"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const response_dto_1 = require("../dto/response.dto");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException
            ? exception.message
            : 'Internal server error';
        const errors = exception instanceof common_1.HttpException
            ? this.extractErrors(exception)
            : ['An unexpected error occurred'];
        this.logger.error(`${request.method} ${request.url} - Status: ${status} - Message: ${message}`, exception instanceof Error ? exception.stack : '');
        const errorResponse = new response_dto_1.ResponseDto(status, message, null, errors);
        errorResponse.path = request.url;
        errorResponse.timestamp = new Date().toISOString();
        response.status(status).json(errorResponse);
    }
    extractErrors(exception) {
        const exceptionResponse = exception.getResponse();
        if (typeof exceptionResponse === 'string') {
            return [exceptionResponse];
        }
        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const response = exceptionResponse;
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
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map