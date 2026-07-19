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
  console.log('Starting database seed...');

  // ============================================================
  // 1. CREATE ROLES
  // ============================================================
  console.log('Creating roles...');

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPERADMIN' },
      update: {},
      create: {
        name: 'SUPERADMIN',
        description: 'Super Administrator with full system access and control',
        permissions: JSON.stringify([
          'users.manage',
          'roles.manage',
          'permissions.manage',
          'residents.manage',
          'employees.manage',
          'invoices.manage',
          'payments.manage',
          'transactions.manage',
          'inventory.manage',
          'salary.manage',
          'events.manage',
          'notifications.manage',
          'settings.manage',
          'system.manage',
          'audit.view',
          'logs.view',
        ]),
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'System Administrator with full access',
        permissions: JSON.stringify([
          'users.manage',
          'roles.manage',
          'residents.manage',
          'employees.manage',
          'invoices.manage',
          'payments.manage',
          'transactions.manage',
          'inventory.manage',
          'salary.manage',
          'events.manage',
          'notifications.manage',
          'settings.manage',
        ]),
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'ACCOUNTANT' },
      update: {},
      create: {
        name: 'ACCOUNTANT',
        description: 'Accountant with financial management access',
        permissions: JSON.stringify([
          'invoices.manage',
          'payments.manage',
          'transactions.manage',
          'salary.view',
          'salary.manage',
          'reports.view',
        ]),
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: {
        name: 'MANAGER',
        description: 'Manager with operational oversight access',
        permissions: JSON.stringify([
          'residents.view',
          'employees.view',
          'invoices.view',
          'payments.view',
          'transactions.view',
          'inventory.view',
          'salary.view',
          'events.view',
          'reports.view',
        ]),
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'STAFF' },
      update: {},
      create: {
        name: 'STAFF',
        description: 'Staff with basic access',
        permissions: JSON.stringify([
          'residents.view',
          'invoices.view',
          'payments.view',
          'inventory.view',
          'events.view',
        ]),
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'PENGURUS' },
      update: {},
      create: {
        name: 'PENGURUS',
        description: 'Pengurus paguyuban (warga) - dapat membuat request pengeluaran',
        permissions: JSON.stringify([
          'expense-requests.create',
          'expense-requests.view',
          'file-attachments.upload',
          'residents.view',
        ]),
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'COORDINATOR' },
      update: {},
      create: {
        name: 'COORDINATOR',
        description: 'Koordinator blok (warga) - dapat submit IPL payment & request pengeluaran',
        permissions: JSON.stringify([
          'ipl-payments.create',
          'expense-requests.create',
          'expense-requests.view',
          'file-attachments.upload',
          'residents.view',
        ]),
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${roles.length} roles`);

  // ============================================================
  // 2. CREATE DEFAULT SUPERADMIN USER
  // ============================================================
  console.log('Creating superadmin user...');

  const superadminPassword = await bcrypt.hash('Superadmin@123', 10);

  const superadminUser = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@goldenhills.com',
      password: superadminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phoneNumber: '+6281234567890',
      isActive: true,
      isEmailVerified: true,
      roleId: roles[0].id, // SUPERADMIN role
    },
  });

  console.log(`✓ Created superadmin user: ${superadminUser.username}`);

  // ============================================================
  // 3. CREATE DEFAULT ADMIN USER
  // ============================================================
  console.log('Creating admin user...');

  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@goldenhills.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+6281234567891',
      isActive: true,
      isEmailVerified: true,
      roleId: roles[1].id, // ADMIN role
    },
  });

  console.log(`✓ Created admin user: ${adminUser.username}`);

  // ============================================================
  // 4. CREATE HOUSE BLOCKS
  // ============================================================
  console.log('Creating house blocks...');

  const houseBlocks = await Promise.all([
    prisma.houseBlock.upsert({
      where: { blockCode: 'BLK-A' },
      update: {},
      create: {
        blockCode: 'BLK-A',
        blockName: 'Block A - Residential',
        blockType: 'RESIDENTIAL',
        address: 'Jalan Golden Hills Block A',
        totalUnits: 24,
        totalFloors: 4,
        constructionYear: 2020,
        facilities: JSON.stringify({
          parking: true,
          gym: true,
          pool: true,
          security: true,
        }),
        isActive: true,
      },
    }),
    prisma.houseBlock.upsert({
      where: { blockCode: 'BLK-B' },
      update: {},
      create: {
        blockCode: 'BLK-B',
        blockName: 'Block B - Residential',
        blockType: 'RESIDENTIAL',
        address: 'Jalan Golden Hills Block B',
        totalUnits: 30,
        totalFloors: 5,
        constructionYear: 2021,
        facilities: JSON.stringify({
          parking: true,
          gym: false,
          pool: true,
          security: true,
        }),
        isActive: true,
      },
    }),
    prisma.houseBlock.upsert({
      where: { blockCode: 'BLK-C' },
      update: {},
      create: {
        blockCode: 'BLK-C',
        blockName: 'Block C - Commercial',
        blockType: 'COMMERCIAL',
        address: 'Jalan Golden Hills Block C',
        totalUnits: 15,
        totalFloors: 3,
        constructionYear: 2019,
        facilities: JSON.stringify({
          parking: true,
          gym: false,
          pool: false,
          security: true,
        }),
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${houseBlocks.length} house blocks`);

  // ============================================================
  // 4.5 CREATE HOUSE UNITS
  // ============================================================
  console.log('Creating house units...');

  const houseUnits = await Promise.all([
    // Block A units
    prisma.houseUnit.upsert({
      where: { unitCode: 'A-101' },
      update: {},
      create: {
        unitCode: 'A-101',
        unitNumber: '101',
        houseBlockId: houseBlocks[0].id,
        landArea: 72.00,
        buildingArea: 45.00,
        floorNumber: 1,
        unitType: 'Tipe 36',
        occupancyStatus: 'FULLY_OCCUPIED',
        iplPercentage: 100,
        isActive: true,
      },
    }),
    prisma.houseUnit.upsert({
      where: { unitCode: 'A-102' },
      update: {},
      create: {
        unitCode: 'A-102',
        unitNumber: '102',
        houseBlockId: houseBlocks[0].id,
        landArea: 72.00,
        buildingArea: 45.00,
        floorNumber: 1,
        unitType: 'Tipe 36',
        occupancyStatus: 'FULLY_OCCUPIED',
        iplPercentage: 100,
        isActive: true,
      },
    }),
    prisma.houseUnit.upsert({
      where: { unitCode: 'A-103' },
      update: {},
      create: {
        unitCode: 'A-103',
        unitNumber: '103',
        houseBlockId: houseBlocks[0].id,
        landArea: 72.00,
        buildingArea: 45.00,
        floorNumber: 1,
        unitType: 'Tipe 36',
        occupancyStatus: 'OCCASIONALLY',
        occupancyNotes: 'Ditinggali seminggu sekali',
        iplPercentage: 50,
        isActive: true,
      },
    }),
    // Block B units
    prisma.houseUnit.upsert({
      where: { unitCode: 'B-201' },
      update: {},
      create: {
        unitCode: 'B-201',
        unitNumber: '201',
        houseBlockId: houseBlocks[1].id,
        landArea: 90.00,
        buildingArea: 60.00,
        floorNumber: 2,
        unitType: 'Tipe 45',
        occupancyStatus: 'FULLY_OCCUPIED',
        iplPercentage: 100,
        isActive: true,
      },
    }),
    prisma.houseUnit.upsert({
      where: { unitCode: 'B-202' },
      update: {},
      create: {
        unitCode: 'B-202',
        unitNumber: '202',
        houseBlockId: houseBlocks[1].id,
        landArea: 90.00,
        buildingArea: 60.00,
        floorNumber: 2,
        unitType: 'Tipe 45',
        occupancyStatus: 'VACANT',
        iplPercentage: 0,
        isActive: true,
      },
    }),
    // Block C commercial unit - bank buyback example
    prisma.houseUnit.upsert({
      where: { unitCode: 'C-301' },
      update: {},
      create: {
        unitCode: 'C-301',
        unitNumber: '301',
        houseBlockId: houseBlocks[2].id,
        landArea: 120.00,
        buildingArea: 80.00,
        floorNumber: 3,
        unitType: 'Commercial',
        occupancyStatus: 'VACANT',
        isBankBuyback: true,
        buybackDate: new Date('2024-01-15'),
        iplPercentage: 0,
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${houseUnits.length} house units`);

  // ============================================================
  // 5. CREATE SAMPLE RESIDENTS
  // ============================================================
  console.log('Creating residents...');

  const residents = await Promise.all([
    prisma.resident.upsert({
      where: { residentCode: 'RES001' },
      update: {},
      create: {
        residentCode: 'RES001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+628111234567',
        identityNumber: '1234567890123456',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'MALE',
        occupation: 'Engineer',
        maritalStatus: 'MARRIED',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+628111234568',
        houseBlockId: houseBlocks[0].id,
        houseUnitId: houseUnits[0].id,
        unitNumber: 'A-101',
        moveInDate: new Date('2022-01-01'),
        ownershipType: 'OWNER',
        isActive: true,
      },
    }),
    prisma.resident.upsert({
      where: { residentCode: 'RES002' },
      update: {},
      create: {
        residentCode: 'RES002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '+628112234567',
        identityNumber: '1234567890123457',
        dateOfBirth: new Date('1990-08-20'),
        gender: 'FEMALE',
        occupation: 'Doctor',
        maritalStatus: 'SINGLE',
        emergencyContact: 'Robert Smith',
        emergencyPhone: '+628112234568',
        houseBlockId: houseBlocks[0].id,
        houseUnitId: houseUnits[1].id,
        unitNumber: 'A-102',
        moveInDate: new Date('2022-03-15'),
        ownershipType: 'RENTER',
        isActive: true,
      },
    }),
    prisma.resident.upsert({
      where: { residentCode: 'RES003' },
      update: {},
      create: {
        residentCode: 'RES003',
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@example.com',
        phoneNumber: '+628113345678',
        identityNumber: '1234567890123458',
        dateOfBirth: new Date('1978-12-10'),
        gender: 'MALE',
        occupation: 'Businessman',
        maritalStatus: 'MARRIED',
        emergencyContact: 'Mary Johnson',
        emergencyPhone: '+628113345679',
        houseBlockId: houseBlocks[1].id,
        houseUnitId: houseUnits[3].id,
        unitNumber: 'B-201',
        moveInDate: new Date('2021-06-01'),
        ownershipType: 'OWNER',
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${residents.length} residents`);

  // ============================================================
  // 6. CREATE EMPLOYEE POSITIONS
  // ============================================================
  console.log('Creating employee positions...');

  const positions = await Promise.all([
    prisma.employeePosition.upsert({
      where: { positionCode: 'POS001' },
      update: {},
      create: {
        positionCode: 'POS001',
        positionName: 'General Manager',
        department: 'Management',
        description: 'Overall management of the company',
        salaryGrade: 'M1',
        level: 10,
        isActive: true,
      },
    }),
    prisma.employeePosition.upsert({
      where: { positionCode: 'POS002' },
      update: {},
      create: {
        positionCode: 'POS002',
        positionName: 'Finance Manager',
        department: 'Finance',
        description: 'Financial management and reporting',
        salaryGrade: 'M2',
        level: 8,
        isActive: true,
      },
    }),
    prisma.employeePosition.upsert({
      where: { positionCode: 'POS003' },
      update: {},
      create: {
        positionCode: 'POS003',
        positionName: 'Accountant',
        department: 'Finance',
        description: 'Accounting and financial operations',
        salaryGrade: 'F1',
        level: 6,
        isActive: true,
      },
    }),
    prisma.employeePosition.upsert({
      where: { positionCode: 'POS004' },
      update: {},
      create: {
        positionCode: 'POS004',
        positionName: 'HR Manager',
        department: 'Human Resources',
        description: 'Human resources management',
        salaryGrade: 'M3',
        level: 7,
        isActive: true,
      },
    }),
    prisma.employeePosition.upsert({
      where: { positionCode: 'POS005' },
      update: {},
      create: {
        positionCode: 'POS005',
        positionName: 'Admin Staff',
        department: 'Administration',
        description: 'Administrative support',
        salaryGrade: 'A1',
        level: 4,
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${positions.length} employee positions`);

  // ============================================================
  // 7. CREATE SAMPLE EMPLOYEES
  // ============================================================
  console.log('Creating employees...');

  const employeePassword = await bcrypt.hash('Employee@123', 10);
  const employeeUser = await prisma.user.upsert({
    where: { username: 'johnson' },
    update: {},
    create: {
      username: 'johnson',
      email: 'robert.johnson@goldenhills.com',
      password: employeePassword,
      firstName: 'Robert',
      lastName: 'Johnson',
      phoneNumber: '+6281234567891',
      isActive: true,
      isEmailVerified: true,
      roleId: roles[2].id, // ACCOUNTANT role
    },
  });

  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { employeeCode: 'EMP001' },
      update: {},
      create: {
        employeeCode: 'EMP001',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@goldenhills.com',
        phoneNumber: '+6281234567801',
        identityNumber: '1234567890123459',
        dateOfBirth: new Date('1980-03-25'),
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        address: 'Jalan Office No. 1',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12345',
        emergencyContact: 'Sarah Chen',
        emergencyPhone: '+6281234567802',
        userId: adminUser.id,
        positionId: positions[0].id,
        hireDate: new Date('2020-01-15'),
        employmentStatus: 'ACTIVE',
        bankName: 'BCA',
        bankAccountNumber: '1234567890',
        bankAccountName: 'Michael Chen',
        taxId: '1234567890',
        isActive: true,
      },
    }),
    prisma.employee.upsert({
      where: { employeeCode: 'EMP002' },
      update: {},
      create: {
        employeeCode: 'EMP002',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@goldenhills.com',
        phoneNumber: '+6281234567803',
        identityNumber: '1234567890123460',
        dateOfBirth: new Date('1985-07-12'),
        gender: 'FEMALE',
        maritalStatus: 'MARRIED',
        address: 'Jalan Finance No. 2',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12346',
        emergencyContact: 'David Williams',
        emergencyPhone: '+6281234567804',
        userId: employeeUser.id,
        positionId: positions[1].id,
        hireDate: new Date('2020-02-01'),
        employmentStatus: 'ACTIVE',
        bankName: 'Mandiri',
        bankAccountNumber: '0987654321',
        bankAccountName: 'Sarah Williams',
        taxId: '1234567891',
        isActive: true,
      },
    }),
    prisma.employee.upsert({
      where: { employeeCode: 'EMP003' },
      update: {},
      create: {
        employeeCode: 'EMP003',
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@goldenhills.com',
        phoneNumber: '+6281234567805',
        identityNumber: '1234567890123461',
        dateOfBirth: new Date('1992-11-30'),
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        address: 'Jalan Accounting No. 3',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12347',
        emergencyContact: 'Emily Brown',
        emergencyPhone: '+6281234567806',
        positionId: positions[2].id,
        hireDate: new Date('2021-06-15'),
        employmentStatus: 'ACTIVE',
        bankName: 'BNI',
        bankAccountNumber: '1122334455',
        bankAccountName: 'David Brown',
        taxId: '1234567892',
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${employees.length} employees`);

  // ============================================================
  // 8. CREATE FEE TYPES
  // ============================================================
  console.log('Creating fee types...');

  const feeTypes = await Promise.all([
    prisma.feeType.upsert({
      where: { feeCode: 'FEE001' },
      update: {},
      create: {
        feeCode: 'FEE001',
        feeName: 'Monthly Maintenance Fee',
        description: 'Monthly maintenance and facility fee',
        feeCategory: 'MAINTENANCE',
        isRecurring: true,
        recurrencePeriod: 'MONTHLY',
        isTaxable: false,
        defaultAmount: 500000,
        isActive: true,
      },
    }),
    prisma.feeType.upsert({
      where: { feeCode: 'FEE002' },
      update: {},
      create: {
        feeCode: 'FEE002',
        feeName: 'Water Utility Fee',
        description: 'Water consumption fee',
        feeCategory: 'UTILITIES',
        isRecurring: true,
        recurrencePeriod: 'MONTHLY',
        isTaxable: false,
        defaultAmount: 150000,
        isActive: true,
      },
    }),
    prisma.feeType.upsert({
      where: { feeCode: 'FEE003' },
      update: {},
      create: {
        feeCode: 'FEE003',
        feeName: 'Electric Utility Fee',
        description: 'Electric consumption fee',
        feeCategory: 'UTILITIES',
        isRecurring: true,
        recurrencePeriod: 'MONTHLY',
        isTaxable: false,
        defaultAmount: 200000,
        isActive: true,
      },
    }),
    prisma.feeType.upsert({
      where: { feeCode: 'FEE004' },
      update: {},
      create: {
        feeCode: 'FEE004',
        feeName: 'Security Service Fee',
        description: '24/7 security service fee',
        feeCategory: 'SECURITY',
        isRecurring: true,
        recurrencePeriod: 'MONTHLY',
        isTaxable: false,
        defaultAmount: 100000,
        isActive: true,
      },
    }),
    prisma.feeType.upsert({
      where: { feeCode: 'FEE005' },
      update: {},
      create: {
        feeCode: 'FEE005',
        feeName: 'Parking Fee',
        description: 'Monthly parking fee',
        feeCategory: 'MAINTENANCE',
        isRecurring: true,
        recurrencePeriod: 'MONTHLY',
        isTaxable: false,
        defaultAmount: 200000,
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${feeTypes.length} fee types`);

  // ============================================================
  // 9. CREATE TRANSACTION CATEGORIES
  // ============================================================
  console.log('Creating transaction categories...');

  const categories = await Promise.all([
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'CAT001' },
      update: { fundType: 'WARGA' },
      create: {
        categoryCode: 'CAT001',
        categoryName: 'Service Fee Income',
        description: 'Income from service fees',
        categoryType: 'INCOME',
        fundType: 'WARGA',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'CAT002' },
      update: { fundType: 'IPL' },
      create: {
        categoryCode: 'CAT002',
        categoryName: 'Utility Payment',
        description: 'Payments for utilities',
        categoryType: 'EXPENSE',
        fundType: 'IPL',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'CAT003' },
      update: { fundType: 'IPL' },
      create: {
        categoryCode: 'CAT003',
        categoryName: 'Salary Payment',
        description: 'Employee salary payments',
        categoryType: 'EXPENSE',
        fundType: 'IPL',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'CAT004' },
      update: { fundType: 'IPL' },
      create: {
        categoryCode: 'CAT004',
        categoryName: 'Maintenance Expense',
        description: 'Building and facility maintenance',
        categoryType: 'EXPENSE',
        fundType: 'IPL',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'CAT005' },
      update: { fundType: 'IPL' },
      create: {
        categoryCode: 'CAT005',
        categoryName: 'Office Supplies',
        description: 'Office supplies and equipment',
        categoryType: 'EXPENSE',
        fundType: 'IPL',
        isActive: true,
      },
    }),
    // IPL and Kegiatan income categories for auto cash transaction creation
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'IPL-MASUK' },
      update: { fundType: 'IPL' },
      create: {
        categoryCode: 'IPL-MASUK',
        categoryName: 'IPL Payment Income',
        description: 'Income from IPL (Iuran Pemeliharaan Lingkungan) payments',
        categoryType: 'INCOME',
        fundType: 'IPL',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'KEGIATAN-MASUK' },
      update: { fundType: 'WARGA' },
      create: {
        categoryCode: 'KEGIATAN-MASUK',
        categoryName: 'Kegiatan Payment Income',
        description: 'Income from community activity (Iuran Kegiatan Warga) payments',
        categoryType: 'INCOME',
        fundType: 'WARGA',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'RESIDENT-MASUK' },
      update: { fundType: 'WARGA' },
      create: {
        categoryCode: 'RESIDENT-MASUK',
        categoryName: 'Resident Payment Income',
        description: 'Income from manual resident payments (tagihan warga)',
        categoryType: 'INCOME',
        fundType: 'WARGA',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'PENGELUARAN-WARGA' },
      update: { fundType: 'WARGA' },
      create: {
        categoryCode: 'PENGELUARAN-WARGA',
        categoryName: 'Pengeluaran Warga/Pengurus',
        description: 'Default category for expense requests submitted by pengurus/warga',
        categoryType: 'EXPENSE',
        fundType: 'WARGA',
        isActive: true,
      },
    }),
    // Expense categories for the separate Kas (Kas IPL / Kas Warga)
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'OPERASIONAL-IPL' },
      update: { fundType: 'IPL' },
      create: {
        categoryCode: 'OPERASIONAL-IPL',
        categoryName: 'Operasional IPL',
        description: 'Pengeluaran operasional paguyuban yang ditanggung Kas IPL',
        categoryType: 'EXPENSE',
        fundType: 'IPL',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'GAJI' },
      update: { fundType: 'IPL' },
      create: {
        categoryCode: 'GAJI',
        categoryName: 'Gaji / Upah',
        description: 'Pembayaran gaji/upah (satpam, dll) yang ditanggung Kas IPL',
        categoryType: 'EXPENSE',
        fundType: 'IPL',
        isActive: true,
      },
    }),
    prisma.transactionCategory.upsert({
      where: { categoryCode: 'KEGIATAN-KELUAR' },
      update: { fundType: 'WARGA' },
      create: {
        categoryCode: 'KEGIATAN-KELUAR',
        categoryName: 'Pengeluaran Kegiatan Warga',
        description: 'Pengeluaran kegiatan warga (cth. 17 Agustusan) dari Kas Warga',
        categoryType: 'EXPENSE',
        fundType: 'WARGA',
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${categories.length} transaction categories`);

  // ============================================================
  // 9b. CASH ACCOUNTS (Kas IPL & Kas Warga) — stable IDs so the
  // split-kas backfill SQL and this seed converge across envs.
  // ============================================================
  const KAS_IPL_ID = '11111111-1111-1111-1111-111111111101';
  const KAS_WARGA_ID = '11111111-1111-1111-1111-111111111102';

  const cashAccounts = await Promise.all([
    prisma.cashAccount.upsert({
      where: { accountCode: 'KAS_IPL' },
      update: { accountName: 'Kas IPL', fundType: 'IPL' },
      create: {
        id: KAS_IPL_ID,
        accountCode: 'KAS_IPL',
        accountName: 'Kas IPL',
        fundType: 'IPL',
        openingBalance: 0,
        isActive: true,
      },
    }),
    prisma.cashAccount.upsert({
      where: { accountCode: 'KAS_WARGA' },
      update: { accountName: 'Kas Warga', fundType: 'WARGA' },
      create: {
        id: KAS_WARGA_ID,
        accountCode: 'KAS_WARGA',
        accountName: 'Kas Warga',
        fundType: 'WARGA',
        openingBalance: 0,
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Upserted ${cashAccounts.length} cash accounts (Kas IPL, Kas Warga)`);

  // ============================================================
  // 10. CREATE SALARY COMPONENTS
  // ============================================================
  console.log('Creating salary components...');

  const salaryComponents = await Promise.all([
    prisma.salaryComponent.upsert({
      where: { componentCode: 'SC001' },
      update: {},
      create: {
        componentCode: 'SC001',
        componentName: 'Basic Salary',
        description: 'Base monthly salary',
        componentType: 'BASIC',
        calculationType: 'FIXED',
        isTaxable: true,
        isFixed: true,
        fixedAmount: 5000000,
        calculationOrder: 1,
        isActive: true,
      },
    }),
    prisma.salaryComponent.upsert({
      where: { componentCode: 'SC002' },
      update: {},
      create: {
        componentCode: 'SC002',
        componentName: 'Transport Allowance',
        description: 'Monthly transport allowance',
        componentType: 'ALLOWANCE',
        calculationType: 'FIXED',
        isTaxable: true,
        isFixed: true,
        fixedAmount: 1000000,
        calculationOrder: 2,
        isActive: true,
      },
    }),
    prisma.salaryComponent.upsert({
      where: { componentCode: 'SC003' },
      update: {},
      create: {
        componentCode: 'SC003',
        componentName: 'Meal Allowance',
        description: 'Monthly meal allowance',
        componentType: 'ALLOWANCE',
        calculationType: 'FIXED',
        isTaxable: true,
        isFixed: true,
        fixedAmount: 500000,
        calculationOrder: 3,
        isActive: true,
      },
    }),
    prisma.salaryComponent.upsert({
      where: { componentCode: 'SC004' },
      update: {},
      create: {
        componentCode: 'SC004',
        componentName: 'Health Insurance',
        description: 'Health insurance deduction',
        componentType: 'DEDUCTION',
        calculationType: 'FIXED',
        isTaxable: false,
        isFixed: true,
        fixedAmount: 200000,
        calculationOrder: 4,
        isActive: true,
      },
    }),
    prisma.salaryComponent.upsert({
      where: { componentCode: 'SC005' },
      update: {},
      create: {
        componentCode: 'SC005',
        componentName: 'Income Tax',
        description: 'Income tax deduction (PPH 21)',
        componentType: 'DEDUCTION',
        calculationType: 'PERCENTAGE',
        isTaxable: false,
        isFixed: false,
        percentage: 5,
        calculationBase: 'GROSS',
        calculationOrder: 5,
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${salaryComponents.length} salary components`);

  // ============================================================
  // 11. CREATE SAMPLE INVENTORY ITEMS
  // ============================================================
  console.log('Creating inventory items...');

  const inventoryItems = await Promise.all([
    prisma.inventory.upsert({
      where: { itemCode: 'INV001' },
      update: {},
      create: {
        itemCode: 'INV001',
        itemName: 'Office Paper A4 80gsm',
        description: 'White A4 paper for office use',
        itemType: 'Office Supplies',
        unit: 'REAM',
        unitCost: 45000,
        minStockLevel: 10,
        maxStockLevel: 100,
        currentStock: 50,
        location: 'Warehouse A - Shelf A1-01',
        supplier: 'PaperOne Corp',
        supplierContact: 'sales@paperone.com',
      },
    }),
    prisma.inventory.upsert({
      where: { itemCode: 'INV002' },
      update: {},
      create: {
        itemCode: 'INV002',
        itemName: 'Ballpoint Pen (Blue)',
        description: 'Standard blue ballpoint pen',
        itemType: 'Office Supplies',
        unit: 'PCS',
        unitCost: 3000,
        minStockLevel: 50,
        maxStockLevel: 500,
        currentStock: 200,
        location: 'Warehouse A - Shelf A2-01',
        supplier: 'Kenko',
        supplierContact: 'sales@kenko.com',
      },
    }),
    prisma.inventory.upsert({
      where: { itemCode: 'INV003' },
      update: {},
      create: {
        itemCode: 'INV003',
        itemName: 'File Folder (Plastic)',
        description: 'Clear plastic file folder',
        itemType: 'Office Supplies',
        unit: 'PCS',
        unitCost: 5000,
        minStockLevel: 20,
        maxStockLevel: 200,
        currentStock: 80,
        location: 'Warehouse A - Shelf A3-01',
        supplier: 'Bantex',
        supplierContact: 'sales@bantex.com',
      },
    }),
  ]);

  console.log(`✓ Created ${inventoryItems.length} inventory items`);

  // ============================================================
  // 12. CREATE SAMPLE COMMUNITY EVENTS
  // ============================================================
  console.log('Creating community events...');

  const events = await Promise.all([
    prisma.communityEvent.upsert({
      where: { eventCode: 'EVT001' },
      update: {},
      create: {
        eventCode: 'EVT001',
        eventName: 'Monthly Residents Meeting',
        description: 'Regular monthly meeting for all residents',
        eventType: 'MEETING',
        location: 'Community Hall',
        startDate: new Date('2026-07-15T19:00:00Z'),
        endDate: new Date('2026-07-15T21:00:00Z'),
        expectedAttendees: 50,
        budget: 500000,
        status: 'SCHEDULED',
        organizer: 'Management Office',
        contactNumber: '+6281234567890',
        isActive: true,
      },
    }),
    prisma.communityEvent.upsert({
      where: { eventCode: 'EVT002' },
      update: {},
      create: {
        eventCode: 'EVT002',
        eventName: 'Independence Day Celebration',
        description: 'Annual Independence Day celebration',
        eventType: 'CELEBRATION',
        location: 'Main Garden',
        startDate: new Date('2026-08-17T16:00:00Z'),
        endDate: new Date('2026-08-17T22:00:00Z'),
        expectedAttendees: 200,
        budget: 5000000,
        status: 'SCHEDULED',
        organizer: 'Event Committee',
        contactNumber: '+6281234567891',
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Created ${events.length} community events`);

  // ============================================================
  // COMPLETE
  // ============================================================
  console.log('\n✓ Database seed completed successfully!');
  console.log('\nDefault login credentials:');
  console.log('Superadmin User:');
  console.log('  Username: superadmin');
  console.log('  Password: Superadmin@123');
  console.log('\nAdmin User:');
  console.log('  Username: admin');
  console.log('  Password: Admin@123');
  console.log('\nEmployee User:');
  console.log('  Username: johnson');
  console.log('  Password: Employee@123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
