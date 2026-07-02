import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateEmployeePositionDto } from './dto/create-employee-position.dto';
import { UpdateEmployeePositionDto } from './dto/update-employee-position.dto';
import { EmployeePositionsRepository } from './employee-positions.repository';

@Injectable()
export class EmployeePositionsService {
  private readonly logger = new Logger(EmployeePositionsService.name);

  constructor(private readonly employeePositionsRepository: EmployeePositionsRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'level', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

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

    const { positions, total } = await this.employeePositionsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: positions,
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
    return await this.employeePositionsRepository.findById(id);
  }

  async create(createEmployeePositionDto: CreateEmployeePositionDto) {
    const existingPosition = await this.employeePositionsRepository.findByPositionCode(
      createEmployeePositionDto.positionCode,
    );
    if (existingPosition) {
      throw new ConflictException('Position code already exists');
    }

    try {
      const position = await this.employeePositionsRepository.create(createEmployeePositionDto);
      this.logger.log(`Employee position created: ${position.positionCode}`);
      return position;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating employee position:', error);
      throw error;
    }
  }

  async update(id: string, updateEmployeePositionDto: UpdateEmployeePositionDto) {
    try {
      const position = await this.employeePositionsRepository.update(id, updateEmployeePositionDto);
      this.logger.log(`Employee position updated: ${position.positionCode}`);
      return position;
    } catch (error) {
      this.logger.error('Error updating employee position:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const position = await this.employeePositionsRepository.softDelete(id);
    this.logger.log(`Employee position soft deleted: ${position.positionCode}`);
    return position;
  }

  async restore(id: string) {
    const position = await this.employeePositionsRepository.restore(id);
    this.logger.log(`Employee position restored: ${position.positionCode}`);
    return position;
  }

  async getActivePositions() {
    return await this.employeePositionsRepository.getActivePositions();
  }

  async getByDepartment(department: string) {
    return await this.employeePositionsRepository.getByDepartment(department);
  }

  async count(where?: any): Promise<number> {
    return await this.employeePositionsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.employeePositionsRepository.exists(id);
  }
}
