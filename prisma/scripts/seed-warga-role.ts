/**
 * Upsert the `WARGA` role for regular residents (warga biasa).
 *
 * Warga need an app login to view the dashboard, but until now they had no
 * dedicated role — they were shoehorned into COORDINATOR/PENGURUS or had none.
 * This provisions a minimal `WARGA` role. The dashboard endpoints have no
 * `@Roles` restriction, so any authenticated user (including WARGA) can read
 * them; the permission list here only matters for routes guarded by
 * PermissionsGuard.
 *
 * Safe & idempotent — upserts by the unique role `name`.
 *
 * Run: npx ts-node prisma/scripts/seed-warga-role.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';

class SeedPrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const adapter = new PrismaMariaDb(connectionString as string);
    super({ adapter });
  }
}

const prisma = new SeedPrismaService();

async function main() {
  const role = await prisma.role.upsert({
    where: { name: 'WARGA' },
    update: {},
    create: {
      name: 'WARGA',
      description: 'Warga (resident) biasa - akses dashboard & data diri sendiri',
      permissions: JSON.stringify(['dashboard.view', 'residents.view']),
      isActive: true,
    },
  });

  console.log(`✓ WARGA role ready (id=${role.id})`);
  console.log('  Assign to a resident via: roleId on the linked User row.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
