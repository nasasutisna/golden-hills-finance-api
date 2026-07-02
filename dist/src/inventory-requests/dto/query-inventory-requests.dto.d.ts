import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryInventoryRequestsDto extends PaginationDto {
    status?: string;
    priority?: string;
    department?: string;
    inventoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}
