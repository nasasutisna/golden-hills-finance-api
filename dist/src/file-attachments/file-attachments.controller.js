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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const file_attachments_service_1 = require("./file-attachments.service");
const update_file_attachment_dto_1 = require("./dto/update-file-attachment.dto");
const query_file_attachments_dto_1 = require("./dto/query-file-attachments.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const platform_express_1 = require("@nestjs/platform-express");
const fs = require("fs");
const path = require("path");
let FileAttachmentsController = class FileAttachmentsController {
    constructor(fileAttachmentsService) {
        this.fileAttachmentsService = fileAttachmentsService;
    }
    async uploadFile() {
        return {
            statusCode: 200,
            message: 'Controller reached',
            data: {},
        };
    }
    async uploadFiles(files, userId, entityType, entityId, category, description) {
        const uploadPromises = files.map(file => {
            const createFileAttachmentDto = {
                entityType,
                entityId,
                fileName: file.originalname,
                filePath: `/uploads/${file.filename}`,
                fileSize: file.size,
                mimeType: file.mimetype,
                category,
                description,
            };
            return this.fileAttachmentsService.create(createFileAttachmentDto, userId);
        });
        return Promise.all(uploadPromises);
    }
    findAll(queryDto) {
        return this.fileAttachmentsService.findAll(queryDto);
    }
    getFileStats() {
        return this.fileAttachmentsService.getFileStats();
    }
    findByEntity(entityType, entityId) {
        return this.fileAttachmentsService.findByEntity(entityType, entityId);
    }
    findByCategory(category) {
        return this.fileAttachmentsService.findByCategory(category);
    }
    findById(id) {
        return this.fileAttachmentsService.findById(id);
    }
    async downloadFile(id, res) {
        const attachment = await this.fileAttachmentsService.findById(id);
        const filePath = path.join(process.cwd(), attachment.filePath);
        if (!fs.existsSync(filePath)) {
            res.status(404).send('File not found');
            return;
        }
        const file = fs.createReadStream(filePath);
        res.header({
            'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
            'Content-Type': attachment.mimeType,
        });
        file.pipe(res);
    }
    async viewFile(id, res) {
        const attachment = await this.fileAttachmentsService.findById(id);
        const filePath = path.join(process.cwd(), attachment.filePath);
        if (!fs.existsSync(filePath)) {
            res.status(404).send('File not found');
            return;
        }
        const file = fs.createReadStream(filePath);
        res.header({
            'Content-Type': attachment.mimeType,
        });
        file.pipe(res);
    }
    update(id, updateFileAttachmentDto) {
        return this.fileAttachmentsService.update(id, updateFileAttachmentDto);
    }
    remove(id) {
        return this.fileAttachmentsService.remove(id);
    }
};
exports.FileAttachmentsController = FileAttachmentsController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'STAFF', 'PENGURUS', 'COORDINATOR'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileAttachmentsController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('upload/multiple'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'STAFF', 'PENGURUS', 'COORDINATOR'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload multiple files' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Files uploaded successfully' }),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('entityType')),
    __param(3, (0, common_1.Body)('entityId')),
    __param(4, (0, common_1.Body)('category')),
    __param(5, (0, common_1.Body)('description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FileAttachmentsController.prototype, "uploadFiles", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all file attachments with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File attachments retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_file_attachments_dto_1.QueryFileAttachmentsDto]),
    __metadata("design:returntype", void 0)
], FileAttachmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FileAttachmentsController.prototype, "getFileStats", null);
__decorate([
    (0, common_1.Get)('entity/:entityType/:entityId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all files for an entity' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Files retrieved successfully' }),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('entityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FileAttachmentsController.prototype, "findByEntity", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all files by category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Files retrieved successfully' }),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FileAttachmentsController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file attachment by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File attachment retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File attachment not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FileAttachmentsController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File downloaded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File attachment not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FileAttachmentsController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Get)(':id/view'),
    (0, swagger_1.ApiOperation)({ summary: 'View file in browser' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File displayed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File attachment not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FileAttachmentsController.prototype, "viewFile", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Update file attachment metadata' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File attachment updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File attachment not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_file_attachment_dto_1.UpdateFileAttachmentDto]),
    __metadata("design:returntype", void 0)
], FileAttachmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete file attachment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File attachment deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File attachment not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FileAttachmentsController.prototype, "remove", null);
exports.FileAttachmentsController = FileAttachmentsController = __decorate([
    (0, swagger_1.ApiTags)('File Attachments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('file-attachments'),
    __metadata("design:paramtypes", [file_attachments_service_1.FileAttachmentsService])
], FileAttachmentsController);
//# sourceMappingURL=file-attachments.controller.js.map