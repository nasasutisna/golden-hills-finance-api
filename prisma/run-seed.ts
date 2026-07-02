import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create Roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System administrator with full access',
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
  });

  const accountantRole = await prisma.role.upsert({
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
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Manager with operational management access',
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
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      description: 'Staff member with basic access',
      permissions: JSON.stringify([
        'residents.view',
        'invoices.view',
        'payments.view',
        'inventory.view',
        'events.view',
      ]),
      isActive: true,
    },
  });

  // Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@goldenhills.com',
      firstName: 'Super',
      lastName: 'Admin',
      phoneNumber: '+6281234567890',
      isActive: true,
      isEmailVerified: true,
      roleId: adminRole.id,
    },
  });

  console.log('✓ Seed completed successfully!');
  console.log('\n=================================');
  console.log('Default Login Credentials:');
  console.log('Username: admin');
  console.log('Password: Admin@123');
  console.log('=================================\n');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
