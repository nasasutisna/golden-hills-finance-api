import { Injectable } from '@nestjs/common';
import { PrismaService, PrismaTransactionalClient } from '../prisma/prisma.service';
import { EXPENSE_REQUEST_ENTITY_TYPE } from './dto/enums';

/** Base include shape reused across find queries. */
const REQUEST_INCLUDE = {
  requester: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      role: { select: { id: true, name: true } },
    },
  },
  approver: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  },
  resident: {
    select: {
      id: true,
      residentCode: true,
      firstName: true,
      lastName: true,
    },
  },
  category: {
    select: {
      id: true,
      categoryCode: true,
      categoryName: true,
      categoryType: true,
    },
  },
};

export type ExpenseRequestWithRelations = any;

@Injectable()
export class ExpenseRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ requests: ExpenseRequestWithRelations[]; total: number }> {
    const { skip = 0, take = 10, where = {}, orderBy = { createdAt: 'desc' } } = params;

    const [requests, total] = await Promise.all([
      this.prisma.expenseRequest.findMany({
        skip,
        take,
        where,
        orderBy,
        include: REQUEST_INCLUDE,
      }),
      this.prisma.expenseRequest.count({ where }),
    ]);

    return { requests, total };
  }

  async findById(id: string): Promise<ExpenseRequestWithRelations | null> {
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id },
      include: REQUEST_INCLUDE,
    });

    if (!request) return null;

    // Attach proof photos + approval history (polymorphic, fetched separately)
    const [files, approvalHistories] = await Promise.all([
      this.prisma.fileAttachment.findMany({
        where: { entityType: EXPENSE_REQUEST_ENTITY_TYPE, entityId: id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.approvalHistory.findMany({
        where: { entityType: 'ExpenseRequest', entityId: id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return { ...request, files, approvalHistories };
  }

  /**
   * Batch-fetch proof photos for a list of request ids and return a map id -> files.
   * Used by findAll to avoid N+1 queries.
   */
  async findFilesByEntityIds(
    ids: string[],
  ): Promise<Record<string, any[]>> {
    if (ids.length === 0) return {};
    const files = await this.prisma.fileAttachment.findMany({
      where: {
        entityType: EXPENSE_REQUEST_ENTITY_TYPE,
        entityId: { in: ids },
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });
    return files.reduce((acc, file) => {
      const key = file.entityId as string;
      if (!acc[key]) acc[key] = [];
      acc[key].push(file);
      return acc;
    }, {} as Record<string, any[]>);
  }

  async create(
    data: any,
    tx?: PrismaTransactionalClient,
  ): Promise<ExpenseRequestWithRelations> {
    const prisma = tx || this.prisma;
    return prisma.expenseRequest.create({ data, include: REQUEST_INCLUDE });
  }

  async update(
    id: string,
    data: any,
    tx?: PrismaTransactionalClient,
  ): Promise<ExpenseRequestWithRelations> {
    const prisma = tx || this.prisma;
    return prisma.expenseRequest.update({ where: { id }, data, include: REQUEST_INCLUDE });
  }

  /**
   * Generate a human-readable request number: REQ-YYYYMMDD-XXXX
   * Count-based sequence per day (matches the pre-existing generateTransactionNumber approach).
   */
  async generateRequestNumber(tx?: PrismaTransactionalClient): Promise<string> {
    const prisma = tx || this.prisma;
    const now = new Date();
    const ymd =
      `${now.getFullYear()}` +
      `${String(now.getMonth() + 1).padStart(2, '0')}` +
      `${String(now.getDate()).padStart(2, '0')}`;

    const countToday = await prisma.expenseRequest.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    });

    return `REQ-${ymd}-${String(countToday + 1).padStart(4, '0')}`;
  }

  /**
   * Link uploaded proof photos to a request.
   * Only links files owned by `userId` that are not yet attached to any entity (entityId IS NULL),
   * preventing a user from claiming another user's uploads.
   */
  async linkFiles(
    requestId: string,
    fileIds: string[],
    userId: string,
    tx?: PrismaTransactionalClient,
  ): Promise<number> {
    const prisma = tx || this.prisma;
    const result = await prisma.fileAttachment.updateMany({
      where: {
        id: { in: fileIds },
        uploadedBy: userId,
        entityId: null,
        deletedAt: null,
      },
      data: { entityId: requestId },
    });
    return result.count;
  }
}
