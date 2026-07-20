"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_module_1 = require("./config/config.module");
const prisma_module_1 = require("./prisma/prisma.module");
const logging_module_1 = require("./common/logging/logging.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const roles_module_1 = require("./roles/roles.module");
const residents_module_1 = require("./residents/residents.module");
const house_blocks_module_1 = require("./house-blocks/house-blocks.module");
const house_units_module_1 = require("./house-units/house-units.module");
const fee_types_module_1 = require("./fee-types/fee-types.module");
const resident_invoices_module_1 = require("./resident-invoices/resident-invoices.module");
const resident_payments_module_1 = require("./resident-payments/resident-payments.module");
const transaction_categories_module_1 = require("./transaction-categories/transaction-categories.module");
const cash_transactions_module_1 = require("./cash-transactions/cash-transactions.module");
const approval_histories_module_1 = require("./approval-histories/approval-histories.module");
const employee_positions_module_1 = require("./employee-positions/employee-positions.module");
const employees_module_1 = require("./employees/employees.module");
const inventories_module_1 = require("./inventories/inventories.module");
const inventory_requests_module_1 = require("./inventory-requests/inventory-requests.module");
const salary_components_module_1 = require("./salary-components/salary-components.module");
const employee_salary_headers_module_1 = require("./employee-salary-headers/employee-salary-headers.module");
const employee_salary_details_module_1 = require("./employee-salary-details/employee-salary-details.module");
const employee_cash_advances_module_1 = require("./employee-cash-advances/employee-cash-advances.module");
const community_events_module_1 = require("./community-events/community-events.module");
const notifications_module_1 = require("./notifications/notifications.module");
const file_attachments_module_1 = require("./file-attachments/file-attachments.module");
const ipl_periods_module_1 = require("./ipl-periods/ipl-periods.module");
const ipl_payments_module_1 = require("./ipl-payments/ipl-payments.module");
const expense_requests_module_1 = require("./expense-requests/expense-requests.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: process.cwd() + '/uploads',
                serveRoot: '/uploads',
            }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.development', '.env.production'],
                cache: true,
            }),
            config_module_1.AppConfigModule,
            logging_module_1.LoggingModule,
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            house_blocks_module_1.HouseBlocksModule,
            house_units_module_1.HouseUnitsModule,
            residents_module_1.ResidentsModule,
            employee_positions_module_1.EmployeePositionsModule,
            employees_module_1.EmployeesModule,
            fee_types_module_1.FeeTypesModule,
            transaction_categories_module_1.TransactionCategoriesModule,
            cash_transactions_module_1.CashTransactionsModule,
            resident_invoices_module_1.ResidentInvoicesModule,
            resident_payments_module_1.ResidentPaymentsModule,
            ipl_periods_module_1.IplPeriodsModule,
            ipl_payments_module_1.IplPaymentsModule,
            expense_requests_module_1.ExpenseRequestsModule,
            approval_histories_module_1.ApprovalHistoriesModule,
            inventories_module_1.InventoriesModule,
            inventory_requests_module_1.InventoryRequestsModule,
            salary_components_module_1.SalaryComponentsModule,
            employee_salary_headers_module_1.EmployeeSalaryHeadersModule,
            employee_salary_details_module_1.EmployeeSalaryDetailsModule,
            employee_cash_advances_module_1.EmployeeCashAdvancesModule,
            community_events_module_1.CommunityEventsModule,
            notifications_module_1.NotificationsModule,
            file_attachments_module_1.FileAttachmentsModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: 'AppConfig',
                useFactory: () => ({
                    port: parseInt(process.env.PORT || '3000', 10),
                    apiPrefix: process.env.API_PREFIX || 'api/v1',
                    appName: process.env.APP_NAME || 'Golden Hills Finance Management System',
                }),
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map