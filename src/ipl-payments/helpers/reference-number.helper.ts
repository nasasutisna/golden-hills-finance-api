import { PrismaTransactionalClient } from '../../prisma/prisma.service';

/**
 * Generate unique reference number for payment
 * Format: REF-{YYYYMMDD}-{sequence}
 * Example: REF-20250114-0001
 *
 * @param prisma - Prisma transactional client
 * @returns Unique reference number
 */
export async function generateReferenceNumber(prisma: PrismaTransactionalClient): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format

  // Find the last reference number for today
  const lastPayment = await prisma.iplPayment.findFirst({
    where: {
      referenceNumber: {
        startsWith: `REF-${dateStr}`,
      },
      deletedAt: null,
    },
    orderBy: {
      referenceNumber: 'desc',
    },
    select: {
      referenceNumber: true,
    },
  });

  let sequence = 1;

  if (lastPayment?.referenceNumber) {
    // Extract sequence number from last reference (REF-20250114-0001 -> 0001)
    const parts = lastPayment.referenceNumber.split('-');
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }

  // Pad sequence with leading zeros (4 digits)
  const sequenceStr = sequence.toString().padStart(4, '0');

  return `REF-${dateStr}-${sequenceStr}`;
}
