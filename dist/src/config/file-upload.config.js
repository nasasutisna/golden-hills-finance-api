"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileUploadConfig = exports.fileUploadConfig = void 0;
const config_1 = require("@nestjs/config");
exports.fileUploadConfig = (0, config_1.registerAs)('fileUpload', () => ({
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
}));
const getFileUploadConfig = () => exports.fileUploadConfig;
exports.getFileUploadConfig = getFileUploadConfig;
//# sourceMappingURL=file-upload.config.js.map