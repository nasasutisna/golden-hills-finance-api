import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileAttachment } from '@prisma/client';

@Injectable()
export class FileAttachmentsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ attachments: FileAttachment[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [attachments, total] = await Promise.all([
      this.prisma.fileAttachment.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.fileAttachment.count({ where }),
    ]);

    return { attachments, total };
  }

  async findById(id: string): Promise<FileAttachment | null> {
    return this.prisma.fileAttachment.findFirst({
      where: { id, deletedAt: null },
      include: {
        uploader: true,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<FileAttachment[]> {
    return this.prisma.fileAttachment.findMany({
      where: {
        entityType,
        entityId,
        deletedAt: null,
      },
      include: {
        uploader: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCategory(category: string): Promise<FileAttachment[]> {
    return this.prisma.fileAttachment.findMany({
      where: {
        category,
        deletedAt: null,
      },
      include: {
        uploader: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any): Promise<FileAttachment> {
    return this.prisma.fileAttachment.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<FileAttachment> {
    const attachment = await this.findById(id);
    if (!attachment) {
      throw new NotFoundException(`File attachment with ID ${id} not found`);
    }

    return this.prisma.fileAttachment.update({
      where: { id },
      data,
      include: {
        uploader: true,
      },
    });
  }

  async softDelete(id: string): Promise<FileAttachment> {
    const attachment = await this.findById(id);
    if (!attachment) {
      throw new NotFoundException(`File attachment with ID ${id} not found`);
    }

    return this.prisma.fileAttachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.fileAttachment.count({ where });
  }
}
