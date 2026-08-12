import { PrismaTransactionalClient } from '../../prisma/prisma.service';

const BLOCK_CODE_PREFIX = 'BLK-';
const BLOCK_CODE_MIN_WIDTH = 3;

/**
 * Generate the next sequential house block code in the form BLK-001, BLK-002, ...
 *
 * Scans ALL blocks — including soft-deleted ones — because `block_code` carries
 * a DB-level @unique constraint covering every row. Skipping soft-deleted blocks
 * could yield a code that collides with a deleted one.
 *
 * The numeric suffix is parsed from existing codes (not string ordering) so the
 * sequence stays correct past the BLK-999 boundary. Pre-existing non-numeric
 * codes (e.g. legacy `BLK-A`) are ignored by the parser.
 *
 * @param prisma - Prisma (transactional) client
 * @returns The next unique block code
 */
export async function generateBlockCode(prisma: PrismaTransactionalClient): Promise<string> {
  const blocks = await prisma.houseBlock.findMany({
    where: { blockCode: { startsWith: BLOCK_CODE_PREFIX } },
    select: { blockCode: true },
  });

  let maxSequence = 0;
  for (const block of blocks) {
    const match = block.blockCode.match(/(\d+)$/);
    if (match) {
      const sequence = parseInt(match[1], 10);
      if (!Number.isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }

  const nextSequence = maxSequence + 1;
  const sequenceStr = nextSequence.toString().padStart(BLOCK_CODE_MIN_WIDTH, '0');

  return `${BLOCK_CODE_PREFIX}${sequenceStr}`;
}
