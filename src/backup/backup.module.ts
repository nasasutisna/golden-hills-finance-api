import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

/**
 * Backup & Restore module.
 *
 * Restore uploads land on disk (not in memory) under backups/_restore so the
 * service can stream large archives to mysql/unzipper without buffering. The
 * temp file is deleted after each restore.
 */
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './backups/_restore',
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname) || '.bin';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
    }),
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
