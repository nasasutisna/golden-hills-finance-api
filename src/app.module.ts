import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggingModule } from './common/logging/logging.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ResidentsModule } from './residents/residents.module';
import { HouseBlocksModule } from './house-blocks/house-blocks.module';
import { HouseUnitsModule } from './house-units/house-units.module';
import { FeeTypesModule } from './fee-types/fee-types.module';
import { ResidentInvoicesModule } from './resident-invoices/resident-invoices.module';
import { ResidentPaymentsModule } from './resident-payments/resident-payments.module';
import { TransactionCategoriesModule } from './transaction-categories/transaction-categories.module';
import { CashTransactionsModule } from './cash-transactions/cash-transactions.module';
import { ApprovalHistoriesModule } from './approval-histories/approval-histories.module';
import { EmployeePositionsModule } from './employee-positions/employee-positions.module';
import { EmployeesModule } from './employees/employees.module';
import { InventoriesModule } from './inventories/inventories.module';
import { InventoryRequestsModule } from './inventory-requests/inventory-requests.module';
import { SalaryComponentsModule } from './salary-components/salary-components.module';
import { EmployeeSalaryHeadersModule } from './employee-salary-headers/employee-salary-headers.module';
import { EmployeeSalaryDetailsModule } from './employee-salary-details/employee-salary-details.module';
import { EmployeeCashAdvancesModule } from './employee-cash-advances/employee-cash-advances.module';
import { CommunityEventsModule } from './community-events/community-events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FileAttachmentsModule } from './file-attachments/file-attachments.module';
import { IplPeriodsModule } from './ipl-periods/ipl-periods.module';
import { IplPaymentsModule } from './ipl-payments/ipl-payments.module';
import { ExpenseRequestsModule } from './expense-requests/expense-requests.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Static file serving
    ServeStaticModule.forRoot({
      rootPath: process.cwd() + '/uploads',
      serveRoot: '/uploads',
    }),
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
      cache: true,
    }),
    AppConfigModule,
    LoggingModule,

    // Database
    PrismaModule,

    // Authentication & Authorization
    AuthModule,
    UsersModule,
    RolesModule,

    // Resident Management
    HouseBlocksModule,
    HouseUnitsModule,
    ResidentsModule,

    // Employee Management
    EmployeePositionsModule,
    EmployeesModule,

    // Financial Management
    FeeTypesModule,
    TransactionCategoriesModule,
    CashTransactionsModule,
    ResidentInvoicesModule,
    ResidentPaymentsModule,
    IplPeriodsModule,
    IplPaymentsModule,
    ExpenseRequestsModule,

    // Audit & Approval
    ApprovalHistoriesModule,

    // Inventory Management
    InventoriesModule,
    InventoryRequestsModule,

    // Salary Management
    SalaryComponentsModule,
    EmployeeSalaryHeadersModule,
    EmployeeSalaryDetailsModule,
    EmployeeCashAdvancesModule,

    // Supporting Modules
    CommunityEventsModule,
    NotificationsModule,
    FileAttachmentsModule,

    // Dashboard (aggregated overview)
    DashboardModule,

    // All modules completed successfully
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
export class AppModule {}
