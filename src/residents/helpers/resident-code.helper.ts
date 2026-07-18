import { PrismaTransactionalClient } from '../../prisma/prisma.service';

const RESIDENT_CODE_PREFIX = 'RES';
const RESIDENT_CODE_MIN_WIDTH = 3;

/**
 * Generate the next sequential resident code in the form RES### (e.g. RES001).
 * Matches the seeded convention (RES001, RES002, RES003).
 *
 * Scans ALL residents — including soft-deleted ones — because `resident_code`
 * carries a DB-level @unique constraint that covers every row. Skipping
 * soft-deleted residents could yield a code that collides with a deleted one.
 *
 * The numeric suffix is computed by parsing existing codes rather than relying
 * on string ordering, so the sequence stays correct past the RES999 boundary.
 *
 * @param prisma - Prisma (transactional) client
 * @returns The next unique resident code
 */
export async function generateResidentCode(prisma: PrismaTransactionalClient): Promise<string> {
  const residents = await prisma.resident.findMany({
    where: { residentCode: { startsWith: RESIDENT_CODE_PREFIX } },
    select: { residentCode: true },
  });

  let maxSequence = 0;
  for (const resident of residents) {
    const match = resident.residentCode.match(/(\d+)$/);
    if (match) {
      const sequence = parseInt(match[1], 10);
      if (!Number.isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }

  const nextSequence = maxSequence + 1;
  const sequenceStr = nextSequence.toString().padStart(RESIDENT_CODE_MIN_WIDTH, '0');

  return `${RESIDENT_CODE_PREFIX}${sequenceStr}`;
}
