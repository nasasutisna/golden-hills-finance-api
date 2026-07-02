"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentInvoicesModule = void 0;
const common_1 = require("@nestjs/common");
const resident_invoices_controller_1 = require("./resident-invoices.controller");
const resident_invoices_service_1 = require("./resident-invoices.service");
const resident_invoices_repository_1 = require("./resident-invoices.repository");
const prisma_module_1 = require("../prisma/prisma.module");
const residents_module_1 = require("../residents/residents.module");
const fee_types_module_1 = require("../fee-types/fee-types.module");
let ResidentInvoicesModule = class ResidentInvoicesModule {
};
exports.ResidentInvoicesModule = ResidentInvoicesModule;
exports.ResidentInvoicesModule = ResidentInvoicesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, residents_module_1.ResidentsModule, fee_types_module_1.FeeTypesModule],
        controllers: [resident_invoices_controller_1.ResidentInvoicesController],
        providers: [resident_invoices_service_1.ResidentInvoicesService, resident_invoices_repository_1.ResidentInvoicesRepository],
        exports: [resident_invoices_service_1.ResidentInvoicesService, resident_invoices_repository_1.ResidentInvoicesRepository],
    })
], ResidentInvoicesModule);
//# sourceMappingURL=resident-invoices.module.js.map