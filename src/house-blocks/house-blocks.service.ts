import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateHouseBlockDto } from './dto/create-house-block.dto';
import { UpdateHouseBlockDto } from './dto/update-house-block.dto';
import { HouseBlocksRepository } from './house-blocks.repository';

@Injectable()
export class HouseBlocksService {
  private readonly logger = new Logger(HouseBlocksService.name);

  constructor(private readonly houseBlocksRepository: HouseBlocksRepository) { }

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'blockCode', sortOrder = 'asc', search, searchFields = 'blockCode,blockName', filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search) {
      // Trim whitespace from each field
      const fields = searchFields.split(',').map(f => f.trim());
      // MySQL is case-insensitive by default for most collations, so no 'mode' needed
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

  async findById(id: string) {
    return await this.houseBlocksRepository.findById(id);
  }

  async findByBlockCode(blockCode: string) {
    const houseBlock = await this.houseBlocksRepository.findByBlockCode(blockCode);
    if (!houseBlock) {
      throw new NotFoundException('House block not found');
    }
    return houseBlock;
  }

  async create(createHouseBlockDto: CreateHouseBlockDto) {
    try {
      const houseBlock = await this.houseBlocksRepository.create(createHouseBlockDto);
      this.logger.log(`House block created: ${houseBlock.blockCode}`);
      return houseBlock;
    } catch (error) {
      this.logger.error('Error creating house block:', error);
      throw error;
    }
  }

  async update(id: string, updateHouseBlockDto: UpdateHouseBlockDto) {
    try {
      const houseBlock = await this.houseBlocksRepository.update(id, updateHouseBlockDto);
      this.logger.log(`House block updated: ${houseBlock.blockCode}`);
      return houseBlock;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating house block:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const houseBlock = await this.houseBlocksRepository.softDelete(id);
    this.logger.log(`House block soft deleted: ${houseBlock.blockCode}`);
    return houseBlock;
  }

  async restore(id: string) {
    const houseBlock = await this.houseBlocksRepository.restore(id);
    this.logger.log(`House block restored: ${houseBlock.blockCode}`);
    return houseBlock;
  }

  async getOccupancyStats() {
    return await this.houseBlocksRepository.getOccupancyStats();
  }

  async count(where?: any): Promise<number> {
    return await this.houseBlocksRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.houseBlocksRepository.exists(id);
  }
}
