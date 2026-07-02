"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const transaction_categories_controller_1 = require("./transaction-categories.controller");
const transaction_categories_service_1 = require("./transaction-categories.service");
const transaction_categories_repository_1 = require("./transaction-categories.repository");
const prisma_module_1 = require("../prisma/prisma.module");
let TransactionCategoriesModule = class TransactionCategoriesModule {
};
exports.TransactionCategoriesModule = TransactionCategoriesModule;
exports.TransactionCategoriesModule = TransactionCategoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [transaction_categories_controller_1.TransactionCategoriesController],
        providers: [transaction_categories_service_1.TransactionCategoriesService, transaction_categories_repository_1.TransactionCategoriesRepository],
        exports: [transaction_categories_service_1.TransactionCategoriesService, transaction_categories_repository_1.TransactionCategoriesRepository],
    })
], TransactionCategoriesModule);
//# sourceMappingURL=transaction-categories.module.js.map