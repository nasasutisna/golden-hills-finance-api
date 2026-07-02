import { PaginationDto } from './pagination.dto';
export declare class QueryOptionsDto extends PaginationDto {
    search?: string;
    searchFields?: string;
    filters?: Record<string, any>;
    fields?: string;
}
export interface QueryOptions {
    pagination: {
        page: number;
        limit: number;
        skip: number;
    };
    sort?: {
        field: string;
        order: 'asc' | 'desc';
    };
    search?: {
        keyword: string;
        fields: string[];
    };
    filters?: Record<string, any>;
    fields?: string[];
}
