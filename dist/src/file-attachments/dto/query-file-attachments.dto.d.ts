import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryFileAttachmentsDto extends PaginationDto {
    entityType?: string;
    entityId?: string;
    category?: string;
    mimeType?: string;
    search?: string;
}
