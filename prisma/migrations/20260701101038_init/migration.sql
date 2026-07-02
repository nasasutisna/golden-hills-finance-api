-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone_number` VARCHAR(20) NULL,
    `avatar` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `last_login_at` DATETIME(3) NULL,
    `refresh_token` TEXT NULL,
    `refresh_token_expiry` DATETIME(3) NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_username_idx`(`username`),
    INDEX `users_role_id_idx`(`role_id`),
    INDEX `users_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `permissions` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    INDEX `roles_name_idx`(`name`),
    INDEX `roles_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `house_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `block_code` VARCHAR(20) NOT NULL,
    `block_name` VARCHAR(100) NOT NULL,
    `block_type` VARCHAR(50) NULL,
    `address` VARCHAR(255) NULL,
    `total_units` INTEGER NOT NULL DEFAULT 0,
    `total_floors` INTEGER NULL,
    `construction_year` INTEGER NULL,
    `land_area` DECIMAL(10, 2) NULL,
    `building_area` DECIMAL(10, 2) NULL,
    `facilities` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `house_blocks_block_code_key`(`block_code`),
    INDEX `house_blocks_block_code_idx`(`block_code`),
    INDEX `house_blocks_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `residents` (
    `id` VARCHAR(191) NOT NULL,
    `resident_code` VARCHAR(20) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone_number` VARCHAR(20) NULL,
    `alternate_phone` VARCHAR(20) NULL,
    `identity_number` VARCHAR(50) NULL,
    `date_of_birth` DATETIME(3) NULL,
    `gender` VARCHAR(20) NULL,
    `occupation` VARCHAR(100) NULL,
    `marital_status` VARCHAR(20) NULL,
    `emergency_contact` VARCHAR(100) NULL,
    `emergency_phone` VARCHAR(20) NULL,
    `house_block_id` VARCHAR(191) NULL,
    `unit_number` VARCHAR(20) NULL,
    `move_in_date` DATETIME(3) NULL,
    `move_out_date` DATETIME(3) NULL,
    `ownership_type` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `residents_resident_code_key`(`resident_code`),
    UNIQUE INDEX `residents_email_key`(`email`),
    INDEX `residents_resident_code_idx`(`resident_code`),
    INDEX `residents_email_idx`(`email`),
    INDEX `residents_house_block_id_idx`(`house_block_id`),
    INDEX `residents_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_positions` (
    `id` VARCHAR(191) NOT NULL,
    `position_code` VARCHAR(20) NOT NULL,
    `position_name` VARCHAR(100) NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `salary_grade` VARCHAR(20) NULL,
    `level` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `employee_positions_position_code_key`(`position_code`),
    INDEX `employee_positions_position_code_idx`(`position_code`),
    INDEX `employee_positions_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `employee_code` VARCHAR(20) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone_number` VARCHAR(20) NULL,
    `alternate_phone` VARCHAR(20) NULL,
    `identity_number` VARCHAR(50) NULL,
    `date_of_birth` DATETIME(3) NULL,
    `gender` VARCHAR(20) NULL,
    `marital_status` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `province` VARCHAR(100) NULL,
    `postal_code` VARCHAR(10) NULL,
    `emergency_contact` VARCHAR(100) NULL,
    `emergency_phone` VARCHAR(20) NULL,
    `position_id` VARCHAR(191) NOT NULL,
    `hire_date` DATETIME(3) NOT NULL,
    `probation_end_date` DATETIME(3) NULL,
    `employment_status` VARCHAR(20) NOT NULL,
    `bank_name` VARCHAR(100) NULL,
    `bank_account_number` VARCHAR(50) NULL,
    `bank_account_name` VARCHAR(100) NULL,
    `tax_id` VARCHAR(30) NULL,
    `photo` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `user_id` VARCHAR(191) NULL,
    `role_id` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `employees_employee_code_key`(`employee_code`),
    UNIQUE INDEX `employees_email_key`(`email`),
    UNIQUE INDEX `employees_user_id_key`(`user_id`),
    INDEX `employees_employee_code_idx`(`employee_code`),
    INDEX `employees_email_idx`(`email`),
    INDEX `employees_position_id_idx`(`position_id`),
    INDEX `employees_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_types` (
    `id` VARCHAR(191) NOT NULL,
    `fee_code` VARCHAR(20) NOT NULL,
    `fee_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `fee_category` VARCHAR(50) NOT NULL,
    `is_recurring` BOOLEAN NOT NULL DEFAULT false,
    `recurrence_period` VARCHAR(20) NULL,
    `is_taxable` BOOLEAN NOT NULL DEFAULT false,
    `default_amount` DECIMAL(15, 2) NULL,
    `tax_rate` DECIMAL(5, 2) NULL,
    `effective_date` DATETIME(3) NULL,
    `expiry_date` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `fee_types_fee_code_key`(`fee_code`),
    INDEX `fee_types_fee_code_idx`(`fee_code`),
    INDEX `fee_types_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_categories` (
    `id` VARCHAR(191) NOT NULL,
    `category_code` VARCHAR(20) NOT NULL,
    `category_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `category_type` VARCHAR(20) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `transaction_categories_category_code_key`(`category_code`),
    INDEX `transaction_categories_category_code_idx`(`category_code`),
    INDEX `transaction_categories_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `transaction_number` VARCHAR(50) NOT NULL,
    `transaction_date` DATETIME(3) NOT NULL,
    `transaction_type` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` VARCHAR(191) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `approved_by` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `cash_transactions_transaction_number_key`(`transaction_number`),
    INDEX `cash_transactions_transaction_number_idx`(`transaction_number`),
    INDEX `cash_transactions_transaction_date_idx`(`transaction_date`),
    INDEX `cash_transactions_transaction_type_idx`(`transaction_type`),
    INDEX `cash_transactions_category_id_idx`(`category_id`),
    INDEX `cash_transactions_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resident_invoices` (
    `id` VARCHAR(191) NOT NULL,
    `invoice_number` VARCHAR(50) NOT NULL,
    `resident_id` VARCHAR(191) NOT NULL,
    `invoice_date` DATETIME(3) NOT NULL,
    `due_date` DATETIME(3) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `balance_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `resident_invoices_invoice_number_key`(`invoice_number`),
    INDEX `resident_invoices_invoice_number_idx`(`invoice_number`),
    INDEX `resident_invoices_resident_id_idx`(`resident_id`),
    INDEX `resident_invoices_invoice_date_idx`(`invoice_date`),
    INDEX `resident_invoices_status_idx`(`status`),
    INDEX `resident_invoices_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resident_invoice_details` (
    `id` VARCHAR(191) NOT NULL,
    `invoice_id` VARCHAR(191) NOT NULL,
    `fee_type_id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(255) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `tax_rate` DECIMAL(5, 2) NULL,
    `tax_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `resident_invoice_details_invoice_id_idx`(`invoice_id`),
    INDEX `resident_invoice_details_fee_type_id_idx`(`fee_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resident_payments` (
    `id` VARCHAR(191) NOT NULL,
    `payment_number` VARCHAR(50) NOT NULL,
    `resident_id` VARCHAR(191) NOT NULL,
    `invoice_id` VARCHAR(191) NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `payment_method` VARCHAR(20) NOT NULL,
    `reference_number` VARCHAR(100) NULL,
    `bank_name` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `transaction_id` VARCHAR(100) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `resident_payments_payment_number_key`(`payment_number`),
    INDEX `resident_payments_payment_number_idx`(`payment_number`),
    INDEX `resident_payments_resident_id_idx`(`resident_id`),
    INDEX `resident_payments_invoice_id_idx`(`invoice_id`),
    INDEX `resident_payments_payment_date_idx`(`payment_date`),
    INDEX `resident_payments_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventories` (
    `id` VARCHAR(191) NOT NULL,
    `item_code` VARCHAR(50) NOT NULL,
    `item_name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `item_type` VARCHAR(50) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `current_stock` INTEGER NOT NULL DEFAULT 0,
    `min_stock_level` INTEGER NULL,
    `max_stock_level` INTEGER NULL,
    `reorder_quantity` INTEGER NULL,
    `unit_cost` DECIMAL(15, 2) NULL,
    `location` VARCHAR(100) NULL,
    `supplier` VARCHAR(200) NULL,
    `supplier_contact` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `inventories_item_code_key`(`item_code`),
    INDEX `inventories_item_code_idx`(`item_code`),
    INDEX `inventories_item_type_idx`(`item_type`),
    INDEX `inventories_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_requests` (
    `id` VARCHAR(191) NOT NULL,
    `request_number` VARCHAR(50) NOT NULL,
    `inventory_id` VARCHAR(191) NOT NULL,
    `requested_quantity` INTEGER NOT NULL,
    `request_date` DATETIME(3) NOT NULL,
    `required_date` DATETIME(3) NULL,
    `purpose` TEXT NULL,
    `department` VARCHAR(100) NULL,
    `priority` VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `approved_by` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `approval_notes` TEXT NULL,
    `requested_by` VARCHAR(191) NOT NULL,
    `completed_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `inventory_requests_request_number_key`(`request_number`),
    INDEX `inventory_requests_request_number_idx`(`request_number`),
    INDEX `inventory_requests_inventory_id_idx`(`inventory_id`),
    INDEX `inventory_requests_status_idx`(`status`),
    INDEX `inventory_requests_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_components` (
    `id` VARCHAR(191) NOT NULL,
    `component_code` VARCHAR(50) NOT NULL,
    `component_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `component_type` VARCHAR(20) NOT NULL,
    `calculation_type` VARCHAR(20) NOT NULL,
    `is_taxable` BOOLEAN NOT NULL DEFAULT false,
    `is_fixed` BOOLEAN NOT NULL DEFAULT true,
    `fixed_amount` DECIMAL(15, 2) NULL,
    `percentage` DECIMAL(5, 2) NULL,
    `calculation_base` VARCHAR(20) NULL,
    `calculation_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `salary_components_component_code_key`(`component_code`),
    INDEX `salary_components_component_code_idx`(`component_code`),
    INDEX `salary_components_component_type_idx`(`component_type`),
    INDEX `salary_components_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_salary_headers` (
    `id` VARCHAR(191) NOT NULL,
    `payroll_number` VARCHAR(50) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `pay_period` VARCHAR(10) NOT NULL,
    `payment_date` DATETIME(3) NULL,
    `basic_salary` DECIMAL(15, 2) NULL,
    `total_allowances` DECIMAL(15, 2) NULL,
    `total_deductions` DECIMAL(15, 2) NULL,
    `net_salary` DECIMAL(15, 2) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `work_days` INTEGER NULL,
    `days_worked` INTEGER NULL,
    `overtime_hours` DECIMAL(5, 2) NULL,
    `leave_days` INTEGER NULL,
    `locked` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `employee_salary_headers_payroll_number_key`(`payroll_number`),
    INDEX `employee_salary_headers_payroll_number_idx`(`payroll_number`),
    INDEX `employee_salary_headers_employee_id_idx`(`employee_id`),
    INDEX `employee_salary_headers_pay_period_idx`(`pay_period`),
    INDEX `employee_salary_headers_status_idx`(`status`),
    INDEX `employee_salary_headers_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_salary_details` (
    `id` VARCHAR(191) NOT NULL,
    `salary_header_id` VARCHAR(191) NOT NULL,
    `component_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `manual_override` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `employee_salary_details_salary_header_id_idx`(`salary_header_id`),
    INDEX `employee_salary_details_component_id_idx`(`component_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_cash_advances` (
    `id` VARCHAR(191) NOT NULL,
    `advance_number` VARCHAR(50) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `request_date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `purpose` TEXT NOT NULL,
    `expected_repayment_date` DATETIME(3) NULL,
    `installment_count` INTEGER NULL DEFAULT 1,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `approved_by` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `disbursement_date` DATETIME(3) NULL,
    `approval_notes` TEXT NULL,
    `requested_by` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `employee_cash_advances_advance_number_key`(`advance_number`),
    INDEX `employee_cash_advances_advance_number_idx`(`advance_number`),
    INDEX `employee_cash_advances_employee_id_idx`(`employee_id`),
    INDEX `employee_cash_advances_status_idx`(`status`),
    INDEX `employee_cash_advances_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_advance_repayments` (
    `id` VARCHAR(191) NOT NULL,
    `advance_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `cash_advance_repayments_advance_id_idx`(`advance_id`),
    INDEX `cash_advance_repayments_payment_date_idx`(`payment_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_events` (
    `id` VARCHAR(191) NOT NULL,
    `event_code` VARCHAR(50) NOT NULL,
    `event_name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `event_type` VARCHAR(50) NOT NULL,
    `location` VARCHAR(200) NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `expected_attendees` INTEGER NULL,
    `budget` DECIMAL(15, 2) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    `organizer` VARCHAR(100) NULL,
    `contact_number` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `community_events_event_code_key`(`event_code`),
    INDEX `community_events_event_code_idx`(`event_code`),
    INDEX `community_events_event_type_idx`(`event_type`),
    INDEX `community_events_status_idx`(`status`),
    INDEX `community_events_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'INFO',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    `action_type` VARCHAR(50) NULL,
    `action_id` VARCHAR(191) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_is_read_idx`(`is_read`),
    INDEX `notifications_priority_idx`(`priority`),
    INDEX `notifications_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `file_attachments_entity_type_idx`(`entity_type`),
    INDEX `file_attachments_entity_id_idx`(`entity_id`),
    INDEX `file_attachments_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_histories` (
    `id` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `comments` TEXT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `approval_histories_entity_type_idx`(`entity_type`),
    INDEX `approval_histories_entity_id_idx`(`entity_id`),
    INDEX `approval_histories_approved_by_idx`(`approved_by`),
    INDEX `approval_histories_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `residents` ADD CONSTRAINT `residents_house_block_id_fkey` FOREIGN KEY (`house_block_id`) REFERENCES `house_blocks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_position_id_fkey` FOREIGN KEY (`position_id`) REFERENCES `employee_positions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_transactions` ADD CONSTRAINT `cash_transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `transaction_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_transactions` ADD CONSTRAINT `cash_transactions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resident_invoices` ADD CONSTRAINT `resident_invoices_resident_id_fkey` FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resident_invoice_details` ADD CONSTRAINT `resident_invoice_details_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `resident_invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resident_invoice_details` ADD CONSTRAINT `resident_invoice_details_fee_type_id_fkey` FOREIGN KEY (`fee_type_id`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resident_payments` ADD CONSTRAINT `resident_payments_resident_id_fkey` FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resident_payments` ADD CONSTRAINT `resident_payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `resident_invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_requests` ADD CONSTRAINT `inventory_requests_inventory_id_fkey` FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_salary_headers` ADD CONSTRAINT `employee_salary_headers_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_salary_headers` ADD CONSTRAINT `employee_salary_headers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_salary_details` ADD CONSTRAINT `employee_salary_details_salary_header_id_fkey` FOREIGN KEY (`salary_header_id`) REFERENCES `employee_salary_headers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_salary_details` ADD CONSTRAINT `employee_salary_details_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `salary_components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_cash_advances` ADD CONSTRAINT `employee_cash_advances_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_advance_repayments` ADD CONSTRAINT `cash_advance_repayments_advance_id_fkey` FOREIGN KEY (`advance_id`) REFERENCES `employee_cash_advances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_attachments` ADD CONSTRAINT `file_attachments_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_histories` ADD CONSTRAINT `approval_histories_approver_user_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_histories` ADD CONSTRAINT `approval_histories_approver_role_fkey` FOREIGN KEY (`approved_by`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_histories` ADD CONSTRAINT `approval_histories_creator_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_histories` ADD CONSTRAINT `approval_histories_transaction_fkey` FOREIGN KEY (`entity_id`) REFERENCES `cash_transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_histories` ADD CONSTRAINT `approval_histories_advance_fkey` FOREIGN KEY (`entity_id`) REFERENCES `employee_cash_advances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
