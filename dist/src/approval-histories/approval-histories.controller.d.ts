import { ApprovalHistoriesService } from './approval-histories.service';
import { CreateApprovalHistoryDto } from './dto/create-approval-history.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
export declare class ApprovalHistoriesController {
    private readonly approvalHistoriesService;
    constructor(approvalHistoriesService: ApprovalHistoriesService);
    create(createApprovalHistoryDto: CreateApprovalHistoryDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            comments: string | null;
            id: string;
            createdAt: Date;
            deletedAt: Date | null;
            status: string;
            entityType: string;
            entityId: string;
            action: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
        };
    }>;
    findAll(queryOptions: QueryOptionsDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            comments: string | null;
            id: string;
            createdAt: Date;
            deletedAt: Date | null;
            status: string;
            entityType: string;
            entityId: string;
            action: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getByEntity(entityType: string, entityId: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            comments: string | null;
            id: string;
            createdAt: Date;
            deletedAt: Date | null;
            status: string;
            entityType: string;
            entityId: string;
            action: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
        }[];
    }>;
}
