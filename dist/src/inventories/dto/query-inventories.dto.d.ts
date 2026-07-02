import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryInventoriesDto extends PaginationDto {
    itemType?: string;
    unit?: string;
    location?: string;
    search?: string;
    lowStock?: boolean;
}
