import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateFeeTypeDto } from './dto/create-fee-type.dto';
import { UpdateFeeTypeDto } from './dto/update-fee-type.dto';
import { FeeTypesRepository } from './fee-types.repository';

@Injectable()
export class FeeTypesService {
  private readonly logger = new Logger(FeeTypesService.name);

  constructor(private readonly feeTypesRepository: FeeTypesRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'feeCode', sortOrder = 'asc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    if (filters) {
      where = { ...where, ...filters };
    }

    const { feeTypes, total } = await this.feeTypesRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: feeTypes,
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
    return await this.feeTypesRepository.findById(id);
  }

  async create(createFeeTypeDto: CreateFeeTypeDto) {
    // Check if fee code already exists
    const existingFeeType = await this.feeTypesRepository.findByFeeCode(
      createFeeTypeDto.feeCode,
    );
    if (existingFeeType) {
      throw new ConflictException('Fee code already exists');
    }

    try {
      const feeType = await this.feeTypesRepository.create(createFeeTypeDto);
      this.logger.log(`Fee type created: ${feeType.feeCode}`);
      return feeType;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating fee type:', error);
      throw error;
    }
  }

  async update(id: string, updateFeeTypeDto: UpdateFeeTypeDto) {
    try {
      const feeType = await this.feeTypesRepository.update(id, updateFeeTypeDto);
      this.logger.log(`Fee type updated: ${feeType.feeCode}`);
      return feeType;
    } catch (error) {
      this.logger.error('Error updating fee type:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const feeType = await this.feeTypesRepository.softDelete(id);
    this.logger.log(`Fee type soft deleted: ${feeType.feeCode}`);
    return feeType;
  }

  async restore(id: string) {
    const feeType = await this.feeTypesRepository.restore(id);
    this.logger.log(`Fee type restored: ${feeType.feeCode}`);
    return feeType;
  }

  async getActiveFeeTypes() {
    return await this.feeTypesRepository.getActiveFeeTypes();
  }

  async getByCategory(category: string) {
    return await this.feeTypesRepository.getByCategory(category);
  }

  async count(where?: any): Promise<number> {
    return await this.feeTypesRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.feeTypesRepository.exists(id);
  }
}
