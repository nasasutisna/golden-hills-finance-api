import { PrismaService } from '../prisma/prisma.service';
import { ApprovalHistory } from '@prisma/client';
export declare class ApprovalHistoriesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        histories: ApprovalHistory[];
        total: number;
    }>;
    findByEntity(entityType: string, entityId: string): Promise<ApprovalHistory[]>;
    create(data: any): Promise<ApprovalHistory>;
    count(where?: any): Promise<number>;
}
