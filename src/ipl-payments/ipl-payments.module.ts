import { Module } from '@nestjs/common';
import { IplPaymentsService } from './ipl-payments.service';
import { IplPaymentsController } from './ipl-payments.controller';
import { IplPaymentsRepository } from './ipl-payments.repository';
import { IplReceiptsService } from './ipl-receipts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IplPeriodsModule } from '../ipl-periods/ipl-periods.module';
import { ApprovalHistoriesModule } from '../approval-histories/approval-histories.module';
import { FileAttachmentsModule } from '../file-attachments/file-attachments.module';
import { CashTransactionsModule } from '../cash-transactions/cash-transactions.module';
import { ResidentPaymentsModule } from '../resident-payments/resident-payments.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Sanitize filename by removing special characters and replacing spaces with underscores
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '_') // Replace hyphens with underscores
    .trim();
}

@Module({
  imports: [
    PrismaModule,
    IplPeriodsModule,
    ApprovalHistoriesModule,
    FileAttachmentsModule,
    CashTransactionsModule,
    ResidentPaymentsModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Create uploads folder if it doesn't exist
          const uploadPath = './uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          // Store in temp folder initially, will be moved after payment creation
          const tempPath = path.join(uploadPath, 'temp');
          if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, { recursive: true });
          }
          cb(null, tempPath);
        },
        filename: (req, file, cb) => {
          // Use UUID as temporary filename, will be renamed after payment creation
          const uniqueName = `temp_${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only images and PDF allowed.'), false);
        }
      },
    }),
  ],
  controllers: [IplPaymentsController],
  providers: [IplPaymentsService, IplPaymentsRepository, IplReceiptsService],
  exports: [IplPaymentsService, IplPaymentsRepository, IplReceiptsService],
})
export class IplPaymentsModule {}
