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
exports.FileAttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const file_attachments_repository_1 = require("./file-attachments.repository");
const fs = require("fs");
const path = require("path");
let FileAttachmentsService = class FileAttachmentsService {
    constructor(repository) {
        this.repository = repository;
    }
    async create(createFileAttachmentDto, userId) {
        return this.repository.create({
            ...createFileAttachmentDto,
            uploadedBy: userId,
        });
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, entityType, entityId, category, mimeType, search } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (entityType) {
            where.entityType = entityType;
        }
        if (entityId) {
            where.entityId = entityId;
        }
        if (category) {
            where.category = category;
        }
        if (mimeType) {
            where.mimeType = { contains: mimeType, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { fileName: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'desc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const attachment = await this.repository.findById(id);
        if (!attachment) {
            throw new common_1.NotFoundException(`File attachment with ID ${id} not found`);
        }
        return attachment;
    }
    async findByEntity(entityType, entityId) {
        return this.repository.findByEntity(entityType, entityId);
    }
    async findByCategory(category) {
        return this.repository.findByCategory(category);
    }
    async update(id, updateFileAttachmentDto) {
        return this.repository.update(id, updateFileAttachmentDto);
    }
    async remove(id) {
        const attachment = await this.findById(id);
        const filePath = path.join(process.cwd(), attachment.filePath);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (error) {
            console.warn(`Failed to delete file at ${filePath}:`, error.message);
        }
        return this.repository.softDelete(id);
    }
    async getFileStats() {
        const totalFiles = await this.repository.count({ deletedAt: null });
        const totalSizeResult = await this.repository['prisma'].fileAttachment.aggregate({
            where: { deletedAt: null },
            _sum: { fileSize: true },
        });
        return {
            totalFiles,
            totalSize: totalSizeResult._sum.fileSize || 0,
        };
    }
};
exports.FileAttachmentsService = FileAttachmentsService;
exports.FileAttachmentsService = FileAttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [file_attachments_repository_1.FileAttachmentsRepository])
], FileAttachmentsService);
//# sourceMappingURL=file-attachments.service.js.map