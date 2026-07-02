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
const resident_payments_controller_1 = require("./resident-payments.controller");
const resident_payments_service_1 = require("./resident-payments.service");
const resident_payments_repository_1 = require("./resident-payments.repository");
const prisma_module_1 = require("../prisma/prisma.module");
const residents_module_1 = require("../residents/residents.module");
const resident_invoices_module_1 = require("../resident-invoices/resident-invoices.module");
let ResidentPaymentsModule = class ResidentPaymentsModule {
};
exports.ResidentPaymentsModule = ResidentPaymentsModule;
exports.ResidentPaymentsModule = ResidentPaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, residents_module_1.ResidentsModule, resident_invoices_module_1.ResidentInvoicesModule],
        controllers: [resident_payments_controller_1.ResidentPaymentsController],
        providers: [resident_payments_service_1.ResidentPaymentsService, resident_payments_repository_1.ResidentPaymentsRepository],
        exports: [resident_payments_service_1.ResidentPaymentsService, resident_payments_repository_1.ResidentPaymentsRepository],
    })
], ResidentPaymentsModule);
//# sourceMappingURL=resident-payments.module.js.map