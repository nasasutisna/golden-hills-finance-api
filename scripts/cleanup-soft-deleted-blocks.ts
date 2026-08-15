/**
 * One-off cleanup: hard-delete house blocks left in a soft-deleted state
 * (deletedAt != null) from before blocks switched to hard delete.
 *
 * These blocks are invisible to the app (everything filters deletedAt: null),
 * yet units/residents may still point at them — the original soft-delete never
 * cascaded. We release those references explicitly, then remove the block rows.
 * Explicit release (instead of relying on the DB ON DELETE SET NULL cascade)
 * makes this safe even if the FK constraints drifted out of sync.
 *
 * Idempotent: safe to re-run; a second run is a no-op.
 *
 *   npx tsx scripts/cleanup-soft-deleted-blocks.ts            # inspect + clean
 *   DRY_RUN=1 npx tsx scripts/cleanup-soft-deleted-blocks.ts  # inspect only
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Prisma 7 + driver adapter requires the adapter in the constructor options
// (see PrismaService). A bare `new PrismaClient()` throws.
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL as string),
});
const DRY_RUN = process.env.DRY_RUN === '1';

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no changes will be made\n' : '🧹 Cleanup mode\n');

  // 1. Find soft-deleted blocks
  const softDeleted = await prisma.houseBlock.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, blockCode: true, blockName: true, deletedAt: true },
  });

  if (softDeleted.length === 0) {
    console.log('✅ No soft-deleted house blocks found. Nothing to clean.');
    return;
  }

  const ids = softDeleted.map((b) => b.id);
  console.log(`Found ${softDeleted.length} soft-deleted block(s):`);
  for (const b of softDeleted) {
    console.log(`  • ${b.blockCode} (${b.blockName}) — deletedAt=${b.deletedAt?.toISOString()}`);
  }

  // 2. Count references that will be released
  const [unitsCount, residentsCount] = await Promise.all([
    prisma.houseUnit.count({ where: { houseBlockId: { in: ids } } }),
    prisma.resident.count({ where: { houseBlockId: { in: ids } } }),
  ]);
  console.log(
    `\nReferences to release → units: ${unitsCount}, residents: ${residentsCount}`,
  );

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN complete. Re-run without DRY_RUN=1 to apply.');
    return;
  }

  // 3. Release + delete in one transaction
  const result = await prisma.$transaction(async (tx) => {
    const units = await tx.houseUnit.updateMany({
      where: { houseBlockId: { in: ids } },
      data: { houseBlockId: null },
    });
    const residents = await tx.resident.updateMany({
      where: { houseBlockId: { in: ids } },
      data: { houseBlockId: null },
    });
    const blocks = await tx.houseBlock.deleteMany({
      where: { id: { in: ids } },
    });
    return { units, residents, blocks };
  });

  console.log(
    `\n✅ Done — released ${result.units.count} unit(s), ${result.residents.count} resident(s); deleted ${result.blocks.count} block(s).`,
  );

  // 4. Verify
  const remaining = await prisma.houseBlock.count({
    where: { deletedAt: { not: null } },
  });
  console.log(`Verification — soft-deleted blocks remaining: ${remaining}`);

  // Note: WhatsappBlast.houseBlockId is a plain (non-FK) snapshot column;
  // historical blast rows may keep a dangling id. Harmless — left untouched.
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
