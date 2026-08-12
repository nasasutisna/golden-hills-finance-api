import { HouseBlocksService } from './house-blocks.service';
import { CreateHouseBlockDto } from './dto/create-house-block.dto';
import { UpdateHouseBlockDto } from './dto/update-house-block.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
export declare class HouseBlocksController {
    private readonly houseBlocksService;
    constructor(houseBlocksService: HouseBlocksService);
    create(createHouseBlockDto: CreateHouseBlockDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            blockCode: string;
            blockName: string;
            coordinatorId: string | null;
        };
    }>;
    findAll(queryOptions: QueryOptionsDto): Promise<{
        statusCode: number;
        message: string;
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
    getOccupancyStats(): Promise<{
        statusCode: number;
        message: string;
        data: {
            totalBlocks: number;
            totalUnits: number;
            occupiedUnits: number;
            vacantUnits: number;
            occupancyRate: number;
        };
    }>;
    findOne(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            blockCode: string;
            blockName: string;
            coordinatorId: string | null;
        };
    }>;
    update(id: string, updateHouseBlockDto: UpdateHouseBlockDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            blockCode: string;
            blockName: string;
            coordinatorId: string | null;
        };
    }>;
    remove(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            blockCode: string;
            blockName: string;
            coordinatorId: string | null;
        };
    }>;
    restore(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            blockCode: string;
            blockName: string;
            coordinatorId: string | null;
        };
    }>;
}
