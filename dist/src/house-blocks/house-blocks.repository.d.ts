import { PrismaService } from '../prisma/prisma.service';
import { HouseBlock } from '@prisma/client';
export declare class HouseBlocksRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
        include?: any;
    }): Promise<{
        houseBlocks: HouseBlock[];
        total: number;
    }>;
    findById(id: string): Promise<HouseBlock>;
    findByBlockCode(blockCode: string): Promise<HouseBlock | null>;
    create(data: any): Promise<HouseBlock>;
    update(id: string, data: any): Promise<HouseBlock>;
    softDelete(id: string): Promise<HouseBlock>;
    restore(id: string): Promise<HouseBlock>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getActiveBlocksCount(): Promise<number>;
    getTotalUnits(): Promise<number>;
    getOccupancyStats(): Promise<{
        totalUnits: number;
        occupiedUnits: number;
        availableUnits: number;
        occupancyRate: number;
    }>;
}
