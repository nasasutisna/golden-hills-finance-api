import { Injectable, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateApprovalHistoryDto } from './dto/create-approval-history.dto';
import { ApprovalHistoriesRepository } from './approval-histories.repository';

@Injectable()
export class ApprovalHistoriesService {
  private readonly logger = new Logger(ApprovalHistoriesService.name);

  constructor(private readonly approvalHistoriesRepository: ApprovalHistoriesRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};
    if (filters) {
      where = { ...where, ...filters };
    }

    const { histories, total } = await this.approvalHistoriesRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: histories,
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

  async findByEntity(entityType: string, entityId: string) {
    return await this.approvalHistoriesRepository.findByEntity(entityType, entityId);
  }

  async create(createApprovalHistoryDto: CreateApprovalHistoryDto) {
    const history = await this.approvalHistoriesRepository.create(createApprovalHistoryDto);
    this.logger.log(`Approval history created for ${history.entityType}:${history.entityId}`);
    return history;
  }

  async count(where?: any): Promise<number> {
    return await this.approvalHistoriesRepository.count(where);
  }
}
