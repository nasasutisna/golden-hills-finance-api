import { PrismaService } from '../../prisma/prisma.service';

/**
 * Generate a unique blast batch number.
 * Format: BLAST-{YYYYMMDD}-{sequence}
 * Example: BLAST-20260721-0001
 *
 * Mirrors the REF- sequence in `reference-number.helper.ts`.
 */
export async function generateBatchNo(prisma: PrismaService): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  const last = await prisma.whatsappBlast.findFirst({
    where: {
      batchNo: { startsWith: `BLAST-${dateStr}` },
      deletedAt: null,
    },
    orderBy: { batchNo: 'desc' },
    select: { batchNo: true },
  });

  let sequence = 1;
  if (last?.batchNo) {
    const parts = last.batchNo.split('-'); // [BLAST, YYYYMMDD, NNNN]
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!Number.isNaN(lastSeq)) sequence = lastSeq + 1;
    }
  }

  return `BLAST-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}
