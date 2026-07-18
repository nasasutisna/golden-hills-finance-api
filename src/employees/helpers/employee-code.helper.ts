import { PrismaTransactionalClient } from '../../prisma/prisma.service';

const EMPLOYEE_CODE_PREFIX = 'EMP';
const EMPLOYEE_CODE_MIN_WIDTH = 3;

/**
 * Generate the next sequential employee code in the form EMP### (e.g. EMP001).
 *
 * Scans ALL employees — including soft-deleted ones — because `employee_code`
 * carries a DB-level @unique constraint that covers every row. Skipping
 * soft-deleted employees could yield a code that collides with a deleted one.
 *
 * The numeric suffix is computed by parsing existing codes rather than relying
 * on string ordering, so the sequence stays correct past the EMP999 boundary.
 *
 * @param prisma - Prisma (transactional) client
 * @returns The next unique employee code
 */
export async function generateEmployeeCode(prisma: PrismaTransactionalClient): Promise<string> {
  const employees = await prisma.employee.findMany({
    where: { employeeCode: { startsWith: EMPLOYEE_CODE_PREFIX } },
    select: { employeeCode: true },
  });

  let maxSequence = 0;
  for (const employee of employees) {
    const match = employee.employeeCode.match(/(\d+)$/);
    if (match) {
      const sequence = parseInt(match[1], 10);
      if (!Number.isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }

  const nextSequence = maxSequence + 1;
  const sequenceStr = nextSequence.toString().padStart(EMPLOYEE_CODE_MIN_WIDTH, '0');

  return `${EMPLOYEE_CODE_PREFIX}${sequenceStr}`;
}
