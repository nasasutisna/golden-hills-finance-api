import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateHouseUnitDto, OccupancyStatus } from './dto/create-house-unit.dto';
import { UpdateHouseUnitDto } from './dto/update-house-unit.dto';
import { HouseUnitsRepository } from './house-units.repository';

@Injectable()
export class HouseUnitsService {
  private readonly logger = new Logger(HouseUnitsService.name);

  constructor(private readonly houseUnitsRepository: HouseUnitsRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'unitCode', sortOrder = 'asc', search, searchFields = 'unitCode,unitNumber', filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search) {
      const fields = searchFields.split(',').map(f => f.trim());
      where.OR = fields.map((field) => ({
        [field]: { contains: search },
      }));
    }

    if (filters) {
      where = { ...where, ...filters };
    }

    const { houseUnits, total } = await this.houseUnitsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: houseUnits,
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
    return await this.houseUnitsRepository.findById(id);
  }

  async findByUnitCode(unitCode: string) {
    const houseUnit = await this.houseUnitsRepository.findByUnitCode(unitCode);
    if (!houseUnit) {
      throw new NotFoundException('House unit not found');
    }
    return houseUnit;
  }

  async findByHouseBlock(houseBlockId: string) {
    return await this.houseUnitsRepository.findByHouseBlock(houseBlockId);
  }

  async create(createHouseUnitDto: CreateHouseUnitDto) {
    try {
      // Auto-set IPL percentage based on occupancy status if not provided
      if (!createHouseUnitDto.iplPercentage && createHouseUnitDto.occupancyStatus) {
        createHouseUnitDto.iplPercentage = this.getIplPercentage(createHouseUnitDto.occupancyStatus);
      }

      const houseUnit = await this.houseUnitsRepository.create(createHouseUnitDto);
      this.logger.log(`House unit created: ${houseUnit.unitCode}`);
      return houseUnit;
    } catch (error) {
      this.logger.error('Error creating house unit:', error);
      throw error;
    }
  }

  async update(id: string, updateHouseUnitDto: UpdateHouseUnitDto) {
    try {
      // Auto-update IPL percentage when occupancy status changes
      if (updateHouseUnitDto.occupancyStatus && updateHouseUnitDto.iplPercentage === undefined) {
        updateHouseUnitDto.iplPercentage = this.getIplPercentage(updateHouseUnitDto.occupancyStatus);
      }

      const houseUnit = await this.houseUnitsRepository.update(id, updateHouseUnitDto);
      this.logger.log(`House unit updated: ${houseUnit.unitCode}`);
      return houseUnit;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating house unit:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const houseUnit = await this.houseUnitsRepository.softDelete(id);
    this.logger.log(`House unit soft deleted: ${houseUnit.unitCode}`);
    return houseUnit;
  }

  async restore(id: string) {
    const houseUnit = await this.houseUnitsRepository.restore(id);
    this.logger.log(`House unit restored: ${houseUnit.unitCode}`);
    return houseUnit;
  }

  async getOccupancyStats() {
    return await this.houseUnitsRepository.getOccupancyStats();
  }

  async getUnitsByOccupancyStatus(occupancyStatus: string) {
    return await this.houseUnitsRepository.getUnitsByOccupancyStatus(occupancyStatus);
  }

  async getBankBuybackUnits() {
    return await this.houseUnitsRepository.getBankBuybackUnits();
  }

  async count(where?: any): Promise<number> {
    return await this.houseUnitsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.houseUnitsRepository.exists(id);
  }

  /**
   * Get IPL percentage based on occupancy status
   * FULLY_OCCUPIED = 100%
   * OCCASIONALLY = 50%
   * VACANT = 0% (or configured differently)
   * RENTED = 100%
   */
  private getIplPercentage(occupancyStatus: OccupancyStatus): number {
    switch (occupancyStatus) {
      case OccupancyStatus.FULLY_OCCUPIED:
        return 100;
      case OccupancyStatus.OCCASIONALLY:
        return 50;
      case OccupancyStatus.VACANT:
        return 0; // Or 50 depending on policy
      case OccupancyStatus.RENTED:
        return 100;
      default:
        return 100;
    }
  }
}
