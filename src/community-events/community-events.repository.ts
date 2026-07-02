import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityEvent } from '@prisma/client';

@Injectable()
export class CommunityEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ events: CommunityEvent[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [events, total] = await Promise.all([
      this.prisma.communityEvent.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.communityEvent.count({ where }),
    ]);

    return { events, total };
  }

  async findById(id: string): Promise<CommunityEvent | null> {
    return this.prisma.communityEvent.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: any): Promise<CommunityEvent> {
    return this.prisma.communityEvent.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<CommunityEvent> {
    const event = await this.findById(id);
    if (!event) {
      throw new NotFoundException(`Community event with ID ${id} not found`);
    }

    return this.prisma.communityEvent.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<CommunityEvent> {
    const event = await this.findById(id);
    if (!event) {
      throw new NotFoundException(`Community event with ID ${id} not found`);
    }

    return this.prisma.communityEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findUpcoming(): Promise<CommunityEvent[]> {
    return this.prisma.communityEvent.findMany({
      where: {
        deletedAt: null,
        startDate: { gte: new Date() },
        status: { in: ['PUBLISHED', 'ONGOING'] },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.communityEvent.count({ where });
  }
}
