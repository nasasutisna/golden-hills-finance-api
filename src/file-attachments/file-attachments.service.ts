import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FileAttachmentsRepository } from './file-attachments.repository';
import { CreateFileAttachmentDto } from './dto/create-file-attachment.dto';
import { UpdateFileAttachmentDto } from './dto/update-file-attachment.dto';
import { QueryFileAttachmentsDto } from './dto/query-file-attachments.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileAttachmentsService {
  constructor(private readonly repository: FileAttachmentsRepository) {}

  async create(createFileAttachmentDto: CreateFileAttachmentDto, userId: string) {
    console.log('FileAttachmentService.create called with:', { dto: createFileAttachmentDto, userId });
    try {
      const result = await this.repository.create({
        ...createFileAttachmentDto,
        uploadedBy: userId,
      });
      console.log('FileAttachmentService.create result:', result);
      return result;
    } catch (error) {
      console.error('FileAttachmentService.create error:', error);
      throw error;
    }
  }

  async findAll(queryDto: QueryFileAttachmentsDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, entityType, entityId, category, mimeType, search } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

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
      where.mimeType = { contains: mimeType };
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'desc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const attachment = await this.repository.findById(id);
    if (!attachment) {
      throw new NotFoundException(`File attachment with ID ${id} not found`);
    }
    return attachment;
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.repository.findByEntity(entityType, entityId);
  }

  async findByCategory(category: string) {
    return this.repository.findByCategory(category);
  }

  async update(id: string, updateFileAttachmentDto: UpdateFileAttachmentDto) {
    return this.repository.update(id, updateFileAttachmentDto);
  }

  async remove(id: string) {
    const attachment = await this.findById(id);

    // Delete physical file
    const filePath = path.join(process.cwd(), attachment.filePath);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to delete file at ${filePath}:`, error);
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
}
