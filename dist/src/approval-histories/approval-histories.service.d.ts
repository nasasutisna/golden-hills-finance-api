import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateApprovalHistoryDto } from './dto/create-approval-history.dto';
import { ApprovalHistoriesRepository } from './approval-histories.repository';
export declare class ApprovalHistoriesService {
    private readonly approvalHistoriesRepository;
    private readonly logger;
    constructor(approvalHistoriesRepository: ApprovalHistoriesRepository);
    findAll(queryOptions: QueryOptionsDto): Promise<{
        data: {
            comments: string | null;
            id: string;
            entityType: string;
            entityId: string;
            createdAt: Date;
            deletedAt: Date | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            createdBy: string;
            action: string;
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
    findByEntity(entityType: string, entityId: string): Promise<{
        comments: string | null;
        id: string;
        entityType: string;
        entityId: string;
        createdAt: Date;
        deletedAt: Date | null;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        createdBy: string;
        action: string;
    }[]>;
    create(createApprovalHistoryDto: CreateApprovalHistoryDto): Promise<{
        comments: string | null;
        id: string;
        entityType: string;
        entityId: string;
        createdAt: Date;
        deletedAt: Date | null;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        createdBy: string;
        action: string;
    }>;
    count(where?: any): Promise<number>;
}
