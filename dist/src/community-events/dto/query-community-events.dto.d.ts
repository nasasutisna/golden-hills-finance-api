import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryCommunityEventsDto extends PaginationDto {
    status?: string;
    eventType?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}
