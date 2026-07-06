"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HouseBlocksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseBlocksService = void 0;
const common_1 = require("@nestjs/common");
const house_blocks_repository_1 = require("./house-blocks.repository");
let HouseBlocksService = HouseBlocksService_1 = class HouseBlocksService {
    constructor(houseBlocksRepository) {
        this.houseBlocksRepository = houseBlocksRepository;
        this.logger = new common_1.Logger(HouseBlocksService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'blockCode', sortOrder = 'asc', search, searchFields = 'blockCode,blockName', filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (search) {
            const fields = searchFields.split(',').map(f => f.trim());
            where.OR = fields.map((field) => ({
                [field]: { contains: search },
            }));
        }
        if (filters) {
            where = { ...where, ...filters };
        }
        const { houseBlocks, total } = await this.houseBlocksRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: houseBlocks,
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    async findById(id) {
        return await this.houseBlocksRepository.findById(id);
    }
    async findByBlockCode(blockCode) {
        const houseBlock = await this.houseBlocksRepository.findByBlockCode(blockCode);
        if (!houseBlock) {
            throw new common_1.NotFoundException('House block not found');
        }
        return houseBlock;
    }
    async create(createHouseBlockDto) {
        try {
            const houseBlock = await this.houseBlocksRepository.create(createHouseBlockDto);
            this.logger.log(`House block created: ${houseBlock.blockCode}`);
            return houseBlock;
        }
        catch (error) {
            this.logger.error('Error creating house block:', error);
            throw error;
        }
    }
    async update(id, updateHouseBlockDto) {
        try {
            const houseBlock = await this.houseBlocksRepository.update(id, updateHouseBlockDto);
            this.logger.log(`House block updated: ${houseBlock.blockCode}`);
            return houseBlock;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Error updating house block:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const houseBlock = await this.houseBlocksRepository.softDelete(id);
        this.logger.log(`House block soft deleted: ${houseBlock.blockCode}`);
        return houseBlock;
    }
    async restore(id) {
        const houseBlock = await this.houseBlocksRepository.restore(id);
        this.logger.log(`House block restored: ${houseBlock.blockCode}`);
        return houseBlock;
    }
    async getOccupancyStats() {
        return await this.houseBlocksRepository.getOccupancyStats();
    }
    async count(where) {
        return await this.houseBlocksRepository.count(where);
    }
    async exists(id) {
        return await this.houseBlocksRepository.exists(id);
    }
};
exports.HouseBlocksService = HouseBlocksService;
exports.HouseBlocksService = HouseBlocksService = HouseBlocksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [house_blocks_repository_1.HouseBlocksRepository])
], HouseBlocksService);
//# sourceMappingURL=house-blocks.service.js.map