import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking house blocks with invalid coordinator IDs...');

  // Get all house blocks with coordinatorId
  const houseBlocks = await prisma.houseBlock.findMany({
    where: {
      deletedAt: null,
      coordinatorId: { not: null },
    },
    select: {
      id: true,
      blockCode: true,
      coordinatorId: true,
    },
  });

  console.log(`Found ${houseBlocks.length} house blocks with coordinatorId`);

  // Check which coordinatorIds are valid residents
  const blocksToFix: Array<{ id: string; blockCode: string; coordinatorId: string }> = [];

  for (const block of houseBlocks) {
    // Check if coordinatorId exists in residents table
    const resident = await prisma.resident.findFirst({
      where: {
        id: block.coordinatorId as string,
        deletedAt: null,
      },
    });

    if (!resident) {
      console.log(`❌ ${block.blockCode}: coordinatorId=${block.coordinatorId} - NOT FOUND in residents`);
      blocksToFix.push({
        id: block.id,
        blockCode: block.blockCode,
        coordinatorId: block.coordinatorId as string,
      });
    } else {
      console.log(`✅ ${block.blockCode}: coordinatorId=${block.coordinatorId} - VALID (${resident.firstName} ${resident.lastName})`);
    }
  }

  if (blocksToFix.length === 0) {
    console.log('\n✅ All coordinator IDs are valid!');
    return;
  }

  console.log(`\nFound ${blocksToFix.length} blocks with invalid coordinator IDs`);

  // Option 1: Clear invalid coordinatorIds
  console.log('\n🔧 Clearing invalid coordinator IDs...');

  for (const block of blocksToFix) {
    await prisma.houseBlock.update({
      where: { id: block.id },
      data: { coordinatorId: null },
    });
    console.log(`  ✓ Cleared coordinatorId for ${block.blockCode}`);
  }

  console.log('\n✅ Done! Invalid coordinator IDs have been cleared.');
  console.log('You can now set new coordinator IDs using valid resident IDs.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
