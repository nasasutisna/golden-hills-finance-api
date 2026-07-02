"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAttachmentsModule = void 0;
const common_1 = require("@nestjs/common");
const file_attachments_controller_1 = require("./file-attachments.controller");
const file_attachments_service_1 = require("./file-attachments.service");
const file_attachments_repository_1 = require("./file-attachments.repository");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
let FileAttachmentsModule = class FileAttachmentsModule {
};
exports.FileAttachmentsModule = FileAttachmentsModule;
exports.FileAttachmentsModule = FileAttachmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: './uploads',
                    filename: (req, file, cb) => {
                        const uniqueName = `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
                        cb(null, uniqueName);
                    },
                }),
                limits: {
                    fileSize: 5 * 1024 * 1024,
                },
                fileFilter: (req, file, cb) => {
                    const allowedMimes = [
                        'image/jpeg',
                        'image/png',
                        'image/gif',
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    ];
                    if (allowedMimes.includes(file.mimetype)) {
                        cb(null, true);
                    }
                    else {
                        cb(new Error('Invalid file type'), false);
                    }
                },
            }),
        ],
        controllers: [file_attachments_controller_1.FileAttachmentsController],
        providers: [file_attachments_service_1.FileAttachmentsService, file_attachments_repository_1.FileAttachmentsRepository],
        exports: [file_attachments_service_1.FileAttachmentsService, file_attachments_repository_1.FileAttachmentsRepository],
    })
], FileAttachmentsModule);
//# sourceMappingURL=file-attachments.module.js.map