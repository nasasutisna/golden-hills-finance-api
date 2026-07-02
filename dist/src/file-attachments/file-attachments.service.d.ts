import { FileAttachmentsRepository } from './file-attachments.repository';
import { CreateFileAttachmentDto } from './dto/create-file-attachment.dto';
import { UpdateFileAttachmentDto } from './dto/update-file-attachment.dto';
import { QueryFileAttachmentsDto } from './dto/query-file-attachments.dto';
export declare class FileAttachmentsService {
    private readonly repository;
    constructor(repository: FileAttachmentsRepository);
    create(createFileAttachmentDto: CreateFileAttachmentDto, userId: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        uploadedBy: string;
    }>;
    findAll(queryDto: QueryFileAttachmentsDto): Promise<{
        attachments: import(".prisma/client").FileAttachment[];
        total: number;
    }>;
    findById(id: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        uploadedBy: string;
    }>;
    findByEntity(entityType: string, entityId: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        uploadedBy: string;
    }[]>;
    findByCategory(category: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        uploadedBy: string;
    }[]>;
    update(id: string, updateFileAttachmentDto: UpdateFileAttachmentDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        uploadedBy: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        uploadedBy: string;
    }>;
    getFileStats(): Promise<{
        totalFiles: number;
        totalSize: number;
    }>;
}
