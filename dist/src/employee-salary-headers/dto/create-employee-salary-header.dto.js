"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEmployeeSalaryHeaderDto = exports.PayrollStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var PayrollStatus;
(function (PayrollStatus) {
    PayrollStatus["DRAFT"] = "DRAFT";
    PayrollStatus["CALCULATED"] = "CALCULATED";
    PayrollStatus["APPROVED"] = "APPROVED";
    PayrollStatus["PAID"] = "PAID";
    PayrollStatus["CANCELLED"] = "CANCELLED";
})(PayrollStatus || (exports.PayrollStatus = PayrollStatus = {}));
class CreateEmployeeSalaryHeaderDto {
    constructor() {
        this.status = PayrollStatus.DRAFT;
        this.locked = false;
    }
}
exports.CreateEmployeeSalaryHeaderDto = CreateEmployeeSalaryHeaderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payroll number',
        example: 'PAY-2024-01',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Payroll number is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeSalaryHeaderDto.prototype, "payrollNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Employee ID',
        example: 'uuid-of-employee',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeSalaryHeaderDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pay period (month and year)',
        example: '2024-01',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Pay period is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeSalaryHeaderDto.prototype, "payPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payment date',
        example: '2024-01-25',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEmployeeSalaryHeaderDto.prototype, "paymentDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Basic salary',
        example: 5000000,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryHeaderDto.prototype, "basicSalary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total allowances',
        example: 1000000,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryHeaderDto.prototype, "totalAllowances", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total deductions',
        example: 500000,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryHeaderDto.prototype, "totalDeductions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Net salary',
        example: 5500000,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryHeaderDto.prototype, "netSalary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payroll status',
        enum: PayrollStatus,
        default: PayrollStatus.DRAFT,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PayrollStatus, { message: 'Invalid payroll status' }),
    __metadata("design:type", String)
], CreateEmployeeSalaryHeaderDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Work days in period',
        example: 22,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryHeaderDto.prototype, "workDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Actual days worked',
        example: 22,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryHeaderDto.prototype, "daysWorked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Overtime hours',
        example: 5,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryHeaderDto.prototype, "overtimeHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Leave days taken',
        example: 0,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryHeaderDto.prototype, "leaveDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is locked (no further modifications)',
        example: false,
        default: false,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateEmployeeSalaryHeaderDto.prototype, "locked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeSalaryHeaderDto.prototype, "notes", void 0);
//# sourceMappingURL=create-employee-salary-header.dto.js.map