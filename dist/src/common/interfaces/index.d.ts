export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface SearchParams {
    search?: string;
    searchFields?: string[];
}
export interface FilterParams {
    filters?: Record<string, any>;
}
export interface QueryParams extends PaginationParams, SearchParams, FilterParams {
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}
export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data?: T;
    errors?: string[];
    timestamp: string;
    path: string;
}
export interface FileUpload {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    filename: string;
    path: string;
}
export interface UserContext {
    id: string;
    username: string;
    email: string;
    roleId: string;
    firstName: string;
    lastName: string;
    permissions?: string[];
}
export interface AuditFields {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
    deletedAt?: Date;
}
export interface ApprovalFields {
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
}
export interface FinancialTransaction {
    amount: number;
    transactionDate: Date;
    transactionType: 'INCOME' | 'EXPENSE';
    categoryId: string;
    referenceType?: string;
    referenceId?: string;
}
