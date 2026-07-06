import { FileAttachmentsRepository } from './file-attachments.repository';
import { CreateFileAttachmentDto } from './dto/create-file-attachment.dto';
import { UpdateFileAttachmentDto } from './dto/update-file-attachment.dto';
import { QueryFileAttachmentsDto } from './dto/query-file-attachments.dto';
export declare class FileAttachmentsService {
    private readonly repository;
    constructor(repository: FileAttachmentsRepository);
    create(createFileAttachmentDto: CreateFileAttachmentDto, userId: string): Promise<{
        id: string;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        description: string | null;
        uploadedBy: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    findAll(queryDto: QueryFileAttachmentsDto): Promise<{
        attachments: import(".prisma/client").FileAttachment[];
        total: number;
    }>;
    findById(id: string): Promise<{
        id: string;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        description: string | null;
        uploadedBy: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    findByEntity(entityType: string, entityId: string): Promise<{
        id: string;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        description: string | null;
        uploadedBy: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    findByCategory(category: string): Promise<{
        id: string;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        description: string | null;
        uploadedBy: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    update(id: string, updateFileAttachmentDto: UpdateFileAttachmentDto): Promise<{
        id: string;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        description: string | null;
        uploadedBy: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        entityType: string;
        entityId: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        category: string | null;
        description: string | null;
        uploadedBy: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    getFileStats(): Promise<{
        totalFiles: number;
        totalSize: number;
    }>;
}
