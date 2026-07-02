import { PrismaService } from '../prisma/prisma.service';
import { FileAttachment } from '@prisma/client';
export declare class FileAttachmentsRepository {
    readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        attachments: FileAttachment[];
        total: number;
    }>;
    findById(id: string): Promise<FileAttachment | null>;
    findByEntity(entityType: string, entityId: string): Promise<FileAttachment[]>;
    findByCategory(category: string): Promise<FileAttachment[]>;
    create(data: any): Promise<FileAttachment>;
    update(id: string, data: any): Promise<FileAttachment>;
    softDelete(id: string): Promise<FileAttachment>;
    count(where?: any): Promise<number>;
}
