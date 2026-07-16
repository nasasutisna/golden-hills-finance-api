"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentPaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const fs = require("fs");
const path = require("path");
const resident_payments_controller_1 = require("./resident-payments.controller");
const resident_payments_service_1 = require("./resident-payments.service");
const resident_payments_repository_1 = require("./resident-payments.repository");
const resident_payment_receipts_service_1 = require("./resident-payment-receipts.service");
const prisma_module_1 = require("../prisma/prisma.module");
const residents_module_1 = require("../residents/residents.module");
const resident_invoices_module_1 = require("../resident-invoices/resident-invoices.module");
const file_attachments_module_1 = require("../file-attachments/file-attachments.module");
const cash_transactions_module_1 = require("../cash-transactions/cash-transactions.module");
let ResidentPaymentsModule = class ResidentPaymentsModule {
};
exports.ResidentPaymentsModule = ResidentPaymentsModule;
exports.ResidentPaymentsModule = ResidentPaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            residents_module_1.ResidentsModule,
            resident_invoices_module_1.ResidentInvoicesModule,
            file_attachments_module_1.FileAttachmentsModule,
            cash_transactions_module_1.CashTransactionsModule,
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
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
                        const uniqueName = `temp_${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
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
                    ];
                    if (allowedMimes.includes(file.mimetype)) {
                        cb(null, true);
                    }
                    else {
                        cb(new Error('Invalid file type. Only images and PDF allowed.'), false);
                    }
                },
            }),
        ],
        controllers: [resident_payments_controller_1.ResidentPaymentsController],
        providers: [resident_payments_service_1.ResidentPaymentsService, resident_payments_repository_1.ResidentPaymentsRepository, resident_payment_receipts_service_1.ResidentPaymentReceiptsService],
        exports: [resident_payments_service_1.ResidentPaymentsService, resident_payments_repository_1.ResidentPaymentsRepository, resident_payment_receipts_service_1.ResidentPaymentReceiptsService],
    })
], ResidentPaymentsModule);
//# sourceMappingURL=resident-payments.module.js.map