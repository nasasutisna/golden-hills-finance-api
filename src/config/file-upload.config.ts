import { registerAs } from '@nestjs/config';

export const fileUploadConfig = registerAs('fileUpload', () => ({
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  allowedFileTypes:
    process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
}));

export const getFileUploadConfig = () => fileUploadConfig;
