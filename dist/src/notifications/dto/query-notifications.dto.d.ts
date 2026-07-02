import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryNotificationsDto extends PaginationDto {
    userId?: string;
    type?: string;
    priority?: string;
    isRead?: boolean;
    actionType?: string;
    search?: string;
}
