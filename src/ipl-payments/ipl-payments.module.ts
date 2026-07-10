import { Module } from '@nestjs/common';
import { IplPaymentsService } from './ipl-payments.service';
import { IplPaymentsController } from './ipl-payments.controller';
import { IplPaymentsRepository } from './ipl-payments.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { IplPeriodsModule } from '../ipl-periods/ipl-periods.module';
import { ApprovalHistoriesModule } from '../approval-histories/approval-histories.module';
import { FileAttachmentsModule } from '../file-attachments/file-attachments.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    PrismaModule,
    IplPeriodsModule,
    ApprovalHistoriesModule,
    FileAttachmentsModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
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
  providers: [IplPaymentsService, IplPaymentsRepository],
  exports: [IplPaymentsService, IplPaymentsRepository],
})
export class IplPaymentsModule {}
