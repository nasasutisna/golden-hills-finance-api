import { PrismaService } from '../prisma/prisma.service';
import { CommunityEvent } from '@prisma/client';
export declare class CommunityEventsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        events: CommunityEvent[];
        total: number;
    }>;
    findById(id: string): Promise<CommunityEvent | null>;
    create(data: any): Promise<CommunityEvent>;
    update(id: string, data: any): Promise<CommunityEvent>;
    softDelete(id: string): Promise<CommunityEvent>;
    findUpcoming(): Promise<CommunityEvent[]>;
    count(where?: any): Promise<number>;
}
