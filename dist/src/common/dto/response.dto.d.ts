export declare class ResponseDto<T> {
    statusCode: number;
    message: string;
    data?: T;
    errors?: string[];
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrevious?: boolean;
    };
    timestamp: string;
    path: string;
    constructor(statusCode: number, message: string, data?: T, errors?: string[]);
}
export declare class ResponseWithPaginationDto<T> {
    statusCode: number;
    message: string;
    data: T[];
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrevious?: boolean;
    };
    timestamp: string;
    path: string;
}
