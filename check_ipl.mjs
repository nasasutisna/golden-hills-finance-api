import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const iplPaymentsCount = await prisma.iplPayment.count({ where: { deletedAt: null } });
const iplBulkPaymentsCount = await prisma.iplBulkPayment.count({ where: { deletedAt: null } });

console.log('ipl_payments (active):', iplPaymentsCount);
console.log('ipl_bulk_payments (active):', iplBulkPaymentsCount);

await prisma.$disconnect();
