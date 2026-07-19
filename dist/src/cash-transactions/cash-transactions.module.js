"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashTransactionsModule = void 0;
const common_1 = require("@nestjs/common");
const cash_transactions_controller_1 = require("./cash-transactions.controller");
const cash_accounts_controller_1 = require("./cash-accounts.controller");
const cash_transactions_service_1 = require("./cash-transactions.service");
const cash_transactions_repository_1 = require("./cash-transactions.repository");
const prisma_module_1 = require("../prisma/prisma.module");
const transaction_categories_module_1 = require("../transaction-categories/transaction-categories.module");
const users_module_1 = require("../users/users.module");
const approval_histories_module_1 = require("../approval-histories/approval-histories.module");
let CashTransactionsModule = class CashTransactionsModule {
};
exports.CashTransactionsModule = CashTransactionsModule;
exports.CashTransactionsModule = CashTransactionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            transaction_categories_module_1.TransactionCategoriesModule,
            users_module_1.UsersModule,
            approval_histories_module_1.ApprovalHistoriesModule,
        ],
        controllers: [cash_transactions_controller_1.CashTransactionsController, cash_accounts_controller_1.CashAccountsController],
        providers: [cash_transactions_service_1.CashTransactionsService, cash_transactions_repository_1.CashTransactionsRepository],
        exports: [cash_transactions_service_1.CashTransactionsService, cash_transactions_repository_1.CashTransactionsRepository],
    })
], CashTransactionsModule);
//# sourceMappingURL=cash-transactions.module.js.map