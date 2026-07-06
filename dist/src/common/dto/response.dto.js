"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseWithPaginationDto = exports.ResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ResponseDto {
    constructor(statusCode, message, data, errors) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.errors = errors;
        this.timestamp = new Date().toISOString();
        this.path = '';
    }
}
exports.ResponseDto = ResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status code',
        example: 200,
    }),
    __metadata("design:type", Number)
], ResponseDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response message',
        example: 'Success',
    }),
    __metadata("design:type", String)
], ResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response data',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Errors if any',
        nullable: true,
        isArray: true,
    }),
    __metadata("design:type", Array)
], ResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pagination metadata',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ResponseDto.prototype, "meta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp of the response',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", String)
], ResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request path',
        example: '/api/v1/users',
    }),
    __metadata("design:type", String)
], ResponseDto.prototype, "path", void 0);
class ResponseWithPaginationDto {
}
exports.ResponseWithPaginationDto = ResponseWithPaginationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status code',
        example: 200,
    }),
    __metadata("design:type", Number)
], ResponseWithPaginationDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response message',
        example: 'Success',
    }),
    __metadata("design:type", String)
], ResponseWithPaginationDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response data',
    }),
    __metadata("design:type", Array)
], ResponseWithPaginationDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp of the response',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", String)
], ResponseWithPaginationDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request path',
        example: '/api/v1/users',
    }),
    __metadata("design:type", String)
], ResponseWithPaginationDto.prototype, "path", void 0);
//# sourceMappingURL=response.dto.js.map