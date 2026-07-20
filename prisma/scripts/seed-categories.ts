/**
 * Upsert the split-kas transaction categories (IPL/WARGA fund types).
 *
 * Safe & idempotent — only touches TransactionCategory rows by categoryCode.
 * The 'GAJI' category (fundType IPL) is required by the simple-payroll flow:
 * EmployeeSalaryHeadersService.createFromSalaryHeader() resolves the Kas IPL
 * expense via this category.
 *
 * Run: npx ts-node prisma/scripts/seed-categories.ts
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

const categories = [
  { categoryCode: 'IPL-MASUK', categoryName: 'IPL Payment Income', description: 'Pemasukan pembayaran IPL ke Kas IPL', categoryType: 'INCOME', fundType: 'IPL' },
  { categoryCode: 'KEGIATAN-MASUK', categoryName: 'Kegiatan Payment Income', description: 'Pemasukan iuran kegiatan warga', categoryType: 'INCOME', fundType: 'WARGA' },
  { categoryCode: 'RESIDENT-MASUK', categoryName: 'Resident Payment Income', description: 'Pemasukan pembayaran warga', categoryType: 'INCOME', fundType: 'WARGA' },
  { categoryCode: 'PENGELUARAN-WARGA', categoryName: 'Pengeluaran Warga/Pengurus', description: 'Pengeluaran warga/pengurus dari Kas Warga', categoryType: 'EXPENSE', fundType: 'WARGA' },
  { categoryCode: 'OPERASIONAL-IPL', categoryName: 'Operasional IPL', description: 'Pengeluaran operasional paguyuban yang ditanggung Kas IPL', categoryType: 'EXPENSE', fundType: 'IPL' },
  { categoryCode: 'GAJI', categoryName: 'Gaji / Upah', description: 'Pembayaran gaji/upah (satpam, dll) yang ditanggung Kas IPL', categoryType: 'EXPENSE', fundType: 'IPL' },
  { categoryCode: 'KEGIATAN-KELUAR', categoryName: 'Pengeluaran Kegiatan Warga', description: 'Pengeluaran kegiatan warga dari Kas Warga', categoryType: 'EXPENSE', fundType: 'WARGA' },
];

async function main() {
  console.log('Upserting split-kas transaction categories...');

  for (const c of categories) {
    await prisma.transactionCategory.upsert({
      where: { categoryCode: c.categoryCode },
      // Only align fundType on existing rows; don't clobber customized names.
      update: { fundType: c.fundType },
      create: {
        categoryCode: c.categoryCode,
        categoryName: c.categoryName,
        description: c.description,
        categoryType: c.categoryType,
        fundType: c.fundType,
        isActive: true,
      },
    });
    console.log(`  ✓ ${c.categoryCode} → ${c.fundType}`);
  }

  console.log(`\nDone. ${categories.length} categories ensured.`);
}

main()
  .catch((e) => {
    console.error('Seed categories failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
