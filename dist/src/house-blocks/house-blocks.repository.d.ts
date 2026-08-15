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
    remove(id: string): Promise<HouseBlock>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getTotalUnits(): Promise<number>;
    getOccupancyStats(): Promise<{
        totalBlocks: number;
        totalUnits: number;
        occupiedUnits: number;
        vacantUnits: number;
        occupancyRate: number;
    }>;
}
