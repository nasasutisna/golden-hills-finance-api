import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { generateBatchNo } from './helpers/batch-number.helper';

/**
 * Data access for WhatsApp blast audit trail.
 * Only place that touches prisma for this module (matches project layering).
 */
@Injectable()
export class WhatsappBlastRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Next BLAST-YYYYMMDD-NNNN sequence for today. */
  nextBatchNo(): Promise<string> {
    return generateBatchNo(this.prisma);
  }

  createBatch(data: Prisma.WhatsappBlastUncheckedCreateInput) {
    return this.prisma.whatsappBlast.create({ data });
  }

  updateBatch(
    id: string,
    data: Prisma.WhatsappBlastUncheckedUpdateInput,
  ) {
    return this.prisma.whatsappBlast.update({ where: { id }, data });
  }

  createRecipient(data: Prisma.WhatsappBlastRecipientUncheckedCreateInput) {
    return this.prisma.whatsappBlastRecipient.create({ data });
  }

  updateRecipient(
    id: string,
    data: Prisma.WhatsappBlastRecipientUncheckedUpdateInput,
  ) {
    return this.prisma.whatsappBlastRecipient.update({ where: { id }, data });
  }

  findBatchById(id: string) {
    return this.prisma.whatsappBlast.findFirst({
      where: { id, deletedAt: null },
      include: {
        recipients: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        triggeredBy: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
    });
  }

  findBatches(params: {
    skip?: number;
    take?: number;
    where?: Prisma.WhatsappBlastWhereInput;
    orderBy?: any;
  }) {
    const { skip, take, where, orderBy } = params;
    return Promise.all([
      this.prisma.whatsappBlast.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          triggeredBy: {
            select: { id: true, username: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.whatsappBlast.count({ where }),
    ]);
  }
}
