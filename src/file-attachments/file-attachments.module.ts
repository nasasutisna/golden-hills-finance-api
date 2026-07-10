import { Module } from '@nestjs/common';
import { FileAttachmentsController } from './file-attachments.controller';
import { FileAttachmentsService } from './file-attachments.service';
import { FileAttachmentsRepository } from './file-attachments.repository';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
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
    }),
  ],
  controllers: [FileAttachmentsController],
  providers: [FileAttachmentsService, FileAttachmentsRepository],
  exports: [FileAttachmentsService, FileAttachmentsRepository],
})
export class FileAttachmentsModule {}
