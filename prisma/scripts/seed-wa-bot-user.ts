/**
 * Upsert the system user that attributes WhatsApp-originated IPL payments.
 *
 * Regular residents have no app login, so `IplPayment.submittedBy` (a required
 * User FK) can't reference them. This script provisions a dedicated system
 * user (`wa-bot-system`) used as the fallback `submittedBy`. Status is always
 * forced to PENDING on bot payments, so the role never auto-approves anything.
 *
 * Safe & idempotent — upserts by username. Prints the user id so you can set
 * `WHATSAPP_BOT_SYSTEM_USER_ID` in .env (the bot also falls back to looking the
 * user up by this username when the env var is empty).
 *
 * Run: npx ts-node prisma/scripts/seed-wa-bot-user.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
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
  const accountantRole = await prisma.role.findFirst({
    where: { name: 'ACCOUNTANT' },
  });
  if (!accountantRole) {
    throw new Error(
      "Role 'ACCOUNTANT' not found — run the main seed (npm run prisma:seed) first.",
    );
  }

  const password = await bcrypt.hash('WaBotSystem!2026', 10);

  const user = await prisma.user.upsert({
    where: { username: 'wa-bot-system' },
    update: {},
    create: {
      username: 'wa-bot-system',
      email: 'wa-bot-system@goldenhills.local',
      password,
      firstName: 'Sistem',
      lastName: 'Bot WhatsApp',
      isActive: true,
      isEmailVerified: true,
      roleId: accountantRole.id,
    },
  });

  console.log(`✓ WA bot system user ready (username=${user.username})`);
  console.log(`  id=${user.id}`);
  console.log('  Set in .env:  WHATSAPP_BOT_SYSTEM_USER_ID=' + user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
