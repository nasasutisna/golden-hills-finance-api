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
exports.CreateFileAttachmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateFileAttachmentDto {
}
exports.CreateFileAttachmentDto = CreateFileAttachmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Entity type (e.g., RESIDENT, EMPLOYEE, INVOICE)',
        example: 'RESIDENT',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Entity type is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFileAttachmentDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Entity ID',
        example: 'uuid-of-entity',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Entity ID is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFileAttachmentDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File name',
        example: 'document.pdf',
        maxLength: 255,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'File name is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateFileAttachmentDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File path',
        example: '/uploads/document.pdf',
        maxLength: 500,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'File path is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateFileAttachmentDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File size in bytes',
        example: 1024000,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'File size is required' }),
    __metadata("design:type", Number)
], CreateFileAttachmentDto.prototype, "file_size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'MIME type',
        example: 'application/pdf',
        maxLength: 100,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'MIME type is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateFileAttachmentDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File category',
        required: false,
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateFileAttachmentDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File description',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFileAttachmentDto.prototype, "description", void 0);
//# sourceMappingURL=create-file-attachment.dto.js.map