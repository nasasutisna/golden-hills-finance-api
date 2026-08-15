import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateHouseBlockDto } from './dto/create-house-block.dto';
import { UpdateHouseBlockDto } from './dto/update-house-block.dto';
import { HouseBlocksRepository } from './house-blocks.repository';
export declare class HouseBlocksService {
    private readonly houseBlocksRepository;
    private readonly logger;
    constructor(houseBlocksRepository: HouseBlocksRepository);
    findAll(queryOptions: QueryOptionsDto): Promise<{
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            blockCode: string;
            blockName: string;
            coordinatorId: string | null;
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
    findById(id: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        blockCode: string;
        blockName: string;
        coordinatorId: string | null;
    }>;
    findByBlockCode(blockCode: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        blockCode: string;
        blockName: string;
        coordinatorId: string | null;
    }>;
    create(createHouseBlockDto: CreateHouseBlockDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        blockCode: string;
        blockName: string;
        coordinatorId: string | null;
    }>;
    update(id: string, updateHouseBlockDto: UpdateHouseBlockDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        blockCode: string;
        blockName: string;
        coordinatorId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        blockCode: string;
        blockName: string;
        coordinatorId: string | null;
    }>;
    getOccupancyStats(): Promise<{
        totalBlocks: number;
        totalUnits: number;
        occupiedUnits: number;
        vacantUnits: number;
        occupancyRate: number;
    }>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
