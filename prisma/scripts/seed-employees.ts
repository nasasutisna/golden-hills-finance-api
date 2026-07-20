/**
 * Seed dummy employee positions & employees for Golden Hills Finance.
 *
 * - Clears `employees` and `employee_positions` first (hard delete).
 * - Inserts 3 positions: Security, Tukang Potong Rumput, Penyapu Taman.
 * - Inserts 9 employees with basic_salary.
 *
 * Run: npx ts-node prisma/scripts/seed-employees.ts
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

type PositionSeed = {
  code: string;
  name: string;
  department: string;
  description: string;
};

type EmployeeSeed = {
  code: string;
  firstName: string;
  lastName?: string;
  positionCode: string;
  basicSalary: number;
};

const POSITIONS: PositionSeed[] = [
  {
    code: 'SEC',
    name: 'Security',
    department: 'Keamanan',
    description: 'Petugas keamanan lingkungan Golden Hills',
  },
  {
    code: 'TPR',
    name: 'Tukang Potong Rumput',
    department: 'Pemeliharaan',
    description: 'Petugas perawatan taman & area rumput',
  },
  {
    code: 'PTM',
    name: 'Penyapu Taman',
    department: 'Pemeliharaan',
    description: 'Petugas kebersihan area taman',
  },
];

const EMPLOYEES: EmployeeSeed[] = [
  // Security — 6 orang, gaji 1.500.000
  { code: 'EMP001', firstName: 'Yopi', positionCode: 'SEC', basicSalary: 1_500_000 },
  { code: 'EMP002', firstName: 'Jaya', positionCode: 'SEC', basicSalary: 1_500_000 },
  { code: 'EMP003', firstName: 'Iwan', positionCode: 'SEC', basicSalary: 1_500_000 },
  { code: 'EMP004', firstName: 'Suherman', positionCode: 'SEC', basicSalary: 1_500_000 },
  { code: 'EMP005', firstName: 'Hartono', positionCode: 'SEC', basicSalary: 1_500_000 },
  { code: 'EMP006', firstName: 'Lukman', positionCode: 'SEC', basicSalary: 1_500_000 },
  // Penyapu Taman — 1 orang, gaji 2.000.000
  { code: 'EMP007', firstName: 'Bu Mana', positionCode: 'PTM', basicSalary: 2_000_000 },
  // Tukang Potong Rumput — 2 orang, gaji 1.400.000
  { code: 'EMP008', firstName: 'Sinaga', positionCode: 'TPR', basicSalary: 1_400_000 },
  { code: 'EMP009', firstName: 'Beo', positionCode: 'TPR', basicSalary: 1_400_000 },
];

const HIRE_DATE = new Date('2024-01-01');

async function main() {
  console.log('Clearing existing employees & employee positions...');

  // Hard-delete employees first (position has onDelete: Restrict).
  // Related tables (salary headers, cash advances) are empty for this dummy set,
  // but delete them defensively in case any exist.
  await prisma.cashAdvanceRepayment.deleteMany();
  await prisma.employeeCashAdvance.deleteMany();
  await prisma.employeeSalaryDetail.deleteMany();
  await prisma.employeeSalaryHeader.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.employeePosition.deleteMany();

  console.log('✓ Cleared');

  console.log('Creating employee positions...');
  const positionByCode: Record<string, string> = {};
  for (const p of POSITIONS) {
    const created = await prisma.employeePosition.create({
      data: {
        positionCode: p.code,
        positionName: p.name,
        department: p.department,
        description: p.description,
        isActive: true,
      },
    });
    positionByCode[p.code] = created.id;
    console.log(`  • ${p.code} — ${p.name}`);
  }

  console.log('Creating employees...');
  for (const e of EMPLOYEES) {
    const created = await prisma.employee.create({
      data: {
        employeeCode: e.code,
        firstName: e.firstName,
        lastName: e.lastName ?? '',
        positionId: positionByCode[e.positionCode],
        hireDate: HIRE_DATE,
        employmentStatus: 'ACTIVE',
        basicSalary: e.basicSalary,
        isActive: true,
      },
    });
    console.log(
      `  • ${created.employeeCode} — ${created.firstName} (${e.positionCode}) gaji ${e.basicSalary.toLocaleString('id-ID')}`,
    );
  }

  console.log('\n✓ Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
