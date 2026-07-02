import { PrismaService } from '../prisma/prisma.service';
import { InventoryRequest } from '@prisma/client';
export declare class InventoryRequestsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        requests: InventoryRequest[];
        total: number;
    }>;
    findById(id: string): Promise<InventoryRequest | null>;
    findByRequestNumber(requestNumber: string): Promise<InventoryRequest | null>;
    create(data: any): Promise<InventoryRequest>;
    update(id: string, data: any): Promise<InventoryRequest>;
    softDelete(id: string): Promise<InventoryRequest>;
    findByStatus(status: string): Promise<InventoryRequest[]>;
    count(where?: any): Promise<number>;
}
