import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { ResidentsRepository } from './residents.repository';

@Injectable()
export class ResidentsService {
  private readonly logger = new Logger(ResidentsService.name);

  constructor(private readonly residentsRepository: ResidentsRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    // Add search filter
    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    // Add additional filters
    if (filters) {
      where = { ...where, ...filters };
    }

    const { residents, total } = await this.residentsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: residents,
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
    return await this.residentsRepository.findById(id);
  }

  async findByResidentCode(residentCode: string) {
    const resident = await this.residentsRepository.findByResidentCode(residentCode);
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    return resident;
  }

  async create(createResidentDto: CreateResidentDto) {
    // Check if resident code already exists
    const existingResident = await this.residentsRepository.findByResidentCode(
      createResidentDto.residentCode,
    );
    if (existingResident) {
      throw new ConflictException('Resident code already exists');
    }

    try {
      const resident = await this.residentsRepository.create(createResidentDto);
      this.logger.log(`Resident created: ${resident.residentCode}`);
      return resident;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating resident:', error);
      throw error;
    }
  }

  async update(id: string, updateResidentDto: UpdateResidentDto) {
    try {
      const resident = await this.residentsRepository.update(id, updateResidentDto);
      this.logger.log(`Resident updated: ${resident.residentCode}`);
      return resident;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating resident:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const resident = await this.residentsRepository.softDelete(id);
    this.logger.log(`Resident soft deleted: ${resident.residentCode}`);
    return resident;
  }

  async restore(id: string) {
    const resident = await this.residentsRepository.restore(id);
    this.logger.log(`Resident restored: ${resident.residentCode}`);
    return resident;
  }

  async getByHouseBlock(houseBlockId: string) {
    return await this.residentsRepository.getByHouseBlock(houseBlockId);
  }

  async getActiveResidentsCount(): Promise<number> {
    return await this.residentsRepository.getActiveResidentsCount();
  }

  async count(where?: any): Promise<number> {
    return await this.residentsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.residentsRepository.exists(id);
  }
}
