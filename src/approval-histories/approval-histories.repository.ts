import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalHistory } from '@prisma/client';

@Injectable()
export class ApprovalHistoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ histories: ApprovalHistory[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [histories, total] = await Promise.all([
      this.prisma.approvalHistory.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          approverUser: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.approvalHistory.count({ where }),
    ]);

    return { histories, total };
  }

  async findByEntity(entityType: string, entityId: string): Promise<ApprovalHistory[]> {
    return this.prisma.approvalHistory.findMany({
      where: { entityType, entityId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        approverUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: any): Promise<ApprovalHistory> {
    return this.prisma.approvalHistory.create({
      data,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        approverUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.approvalHistory.count({ where });
  }
}
