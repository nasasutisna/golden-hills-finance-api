import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { ResidentPaymentsController } from './resident-payments.controller';
import { ResidentPaymentsService } from './resident-payments.service';
import { ResidentPaymentsRepository } from './resident-payments.repository';
import { ResidentPaymentReceiptsService } from './resident-payment-receipts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ResidentsModule } from '../residents/residents.module';
import { ResidentInvoicesModule } from '../resident-invoices/resident-invoices.module';
import { FileAttachmentsModule } from '../file-attachments/file-attachments.module';
import { CashTransactionsModule } from '../cash-transactions/cash-transactions.module';

@Module({
  imports: [
    PrismaModule,
    ResidentsModule,
    ResidentInvoicesModule,
    FileAttachmentsModule,
    CashTransactionsModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          const tempPath = path.join(uploadPath, 'temp');
          if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, { recursive: true });
          }
          cb(null, tempPath);
        },
        filename: (req, file, cb) => {
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
  controllers: [ResidentPaymentsController],
  providers: [ResidentPaymentsService, ResidentPaymentsRepository, ResidentPaymentReceiptsService],
  exports: [ResidentPaymentsService, ResidentPaymentsRepository, ResidentPaymentReceiptsService],
})
export class ResidentPaymentsModule {}
