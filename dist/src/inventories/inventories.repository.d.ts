import { PrismaService } from '../prisma/prisma.service';
import { Inventory } from '@prisma/client';
export declare class InventoriesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        inventories: Inventory[];
        total: number;
    }>;
    findById(id: string): Promise<Inventory | null>;
    findByItemCode(itemCode: string): Promise<Inventory | null>;
    create(data: any): Promise<Inventory>;
    update(id: string, data: any): Promise<Inventory>;
    softDelete(id: string): Promise<Inventory>;
    findLowStock(): Promise<Inventory[]>;
    count(where?: any): Promise<number>;
}
