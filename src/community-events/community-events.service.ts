import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CommunityEventsRepository } from './community-events.repository';
import { CreateCommunityEventDto } from './dto/create-community-event.dto';
import { UpdateCommunityEventDto } from './dto/update-community-event.dto';
import { QueryCommunityEventsDto } from './dto/query-community-events.dto';

@Injectable()
export class CommunityEventsService {
  constructor(private readonly repository: CommunityEventsRepository) {}

  async create(createCommunityEventDto: CreateCommunityEventDto, userId: string) {
    return this.repository.create({
      ...createCommunityEventDto,
      createdBy: userId,
    });
  }

  async findAll(queryDto: QueryCommunityEventsDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, status, eventType, location, dateFrom, dateTo, search } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (location) {
      where.location = { contains: location };
    }

    if (dateFrom || dateTo) {
      where.eventStartDate = {};
      if (dateFrom) {
        where.eventStartDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.eventStartDate.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { eventStartDate: 'desc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const event = await this.repository.findById(id);
    if (!event) {
      throw new NotFoundException(`Community event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: string, updateCommunityEventDto: UpdateCommunityEventDto) {
    return this.repository.update(id, updateCommunityEventDto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async getUpcomingEvents() {
    return this.repository.findUpcoming();
  }
}
