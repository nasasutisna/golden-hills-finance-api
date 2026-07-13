import { PrismaService } from '../prisma/prisma.service';

export async function clearIplPaymentsScript(prisma: PrismaService) {
  console.log('Starting to clear IPL payments data...\n');

  try {
    // 1. Count records before deletion
    const approvalHistoryCount = await prisma.approvalHistory.count({
      where: { entityType: 'IplPayment' },
    });
    console.log(`Found ${approvalHistoryCount} approval history records for IPL payments`);

    const fileAttachmentCount = await prisma.fileAttachment.count({
      where: { entityType: 'IplPayment' },
    });
    console.log(`Found ${fileAttachmentCount} file attachment records for IPL payments`);

    const iplPaymentCount = await prisma.iplPayment.count();
    console.log(`Found ${iplPaymentCount} IPL payment records\n`);

    if (iplPaymentCount === 0) {
      console.log('No IPL payments to delete. Exiting...');
      return;
    }

    // 2. Delete in correct order (respecting foreign key relationships)

    // Delete ApprovalHistory for IPL Payments
    console.log('Deleting approval histories...');
    const approvalResult = await prisma.approvalHistory.deleteMany({
      where: { entityType: 'IplPayment' },
    });
    console.log(`✓ Deleted ${approvalResult.count} approval history records`);

    // Delete FileAttachments for IPL Payments
    console.log('Deleting file attachments...');
    const fileResult = await prisma.fileAttachment.deleteMany({
      where: { entityType: 'IplPayment' },
    });
    console.log(`✓ Deleted ${fileResult.count} file attachment records`);

    // Delete IplPayments
    console.log('Deleting IPL payments...');
    const paymentResult = await prisma.iplPayment.deleteMany({});
    console.log(`✓ Deleted ${paymentResult.count} IPL payment records`);

    console.log('\n✅ Successfully cleared all IPL payments data!');
    return {
      approvalHistoryDeleted: approvalResult.count,
      fileAttachmentsDeleted: fileResult.count,
      paymentsDeleted: paymentResult.count,
    };
  } catch (error) {
    console.error('Error clearing IPL payments:', error);
    throw error;
  }
}
