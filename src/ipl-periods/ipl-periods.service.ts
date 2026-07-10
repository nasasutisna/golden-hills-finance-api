import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { QueryIplPeriodsDto } from './dto/query-ipl-periods.dto';
import { CreateIplPeriodDto } from './dto/create-ipl-period.dto';
import { UpdateIplPeriodDto } from './dto/update-ipl-period.dto';
import { IplPeriodsRepository } from './ipl-periods.repository';

@Injectable()
export class IplPeriodsService {
  private readonly logger = new Logger(IplPeriodsService.name);

  constructor(private readonly iplPeriodsRepository: IplPeriodsRepository) {}

  async findAll(queryOptions: QueryIplPeriodsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, month, year } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search) {
      where.OR = [
        { periodCode: { contains: search } },
        { periodName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (month) {
      where.month = month;
    }

    if (year) {
      where.year = year;
    }

    const { periods, total } = await this.iplPeriodsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: periods,
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
    return await this.iplPeriodsRepository.findById(id);
  }

  async findByPeriodCode(periodCode: string) {
    return await this.iplPeriodsRepository.findByPeriodCode(periodCode);
  }

  async getCurrentPeriod() {
    return await this.iplPeriodsRepository.getCurrentPeriod();
  }

  async getActivePeriods() {
    return await this.iplPeriodsRepository.getActivePeriods();
  }

  async create(createIplPeriodDto: CreateIplPeriodDto) {
    // Check if period code already exists
    const existingPeriod = await this.iplPeriodsRepository.findByPeriodCode(
      createIplPeriodDto.periodCode,
    );
    if (existingPeriod) {
      throw new ConflictException('Period code already exists');
    }

    // Check if period for the same month/year already exists
    const existingMonthYear = await this.iplPeriodsRepository.findByMonthYear(
      createIplPeriodDto.month,
      createIplPeriodDto.year,
    );
    if (existingMonthYear) {
      throw new ConflictException(`Period for ${createIplPeriodDto.month}/${createIplPeriodDto.year} already exists`);
    }

    try {
      const period = await this.iplPeriodsRepository.create(createIplPeriodDto);
      this.logger.log(`IPL period created: ${period.periodCode}`);
      return period;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating IPL period:', error);
      throw error;
    }
  }

  async update(id: string, updateIplPeriodDto: UpdateIplPeriodDto) {
    try {
      const period = await this.iplPeriodsRepository.update(id, updateIplPeriodDto);
      this.logger.log(`IPL period updated: ${period.periodCode}`);
      return period;
    } catch (error) {
      this.logger.error('Error updating IPL period:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const period = await this.iplPeriodsRepository.softDelete(id);
    this.logger.log(`IPL period soft deleted: ${period.periodCode}`);
    return period;
  }

  async restore(id: string) {
    const period = await this.iplPeriodsRepository.restore(id);
    this.logger.log(`IPL period restored: ${period.periodCode}`);
    return period;
  }

  async count(where?: any): Promise<number> {
    return await this.iplPeriodsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.iplPeriodsRepository.exists(id);
  }

  async findWithStats(queryOptions: QueryIplPeriodsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, month, year } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search) {
      where.OR = [
        { periodCode: { contains: search } },
        { periodName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (month) {
      where.month = month;
    }

    if (year) {
      where.year = year;
    }

    const { periods, total } = await this.iplPeriodsRepository.findWithStats({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: periods,
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
}
