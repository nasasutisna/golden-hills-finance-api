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
exports.CreateEmployeeCashAdvanceDto = exports.AdvanceStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var AdvanceStatus;
(function (AdvanceStatus) {
    AdvanceStatus["PENDING"] = "PENDING";
    AdvanceStatus["APPROVED"] = "APPROVED";
    AdvanceStatus["REJECTED"] = "REJECTED";
    AdvanceStatus["DISBURSED"] = "DISBURSED";
    AdvanceStatus["REPAID"] = "REPAID";
    AdvanceStatus["PARTIALLY_REPAID"] = "PARTIALLY_REPAID";
    AdvanceStatus["CANCELLED"] = "CANCELLED";
})(AdvanceStatus || (exports.AdvanceStatus = AdvanceStatus = {}));
class CreateEmployeeCashAdvanceDto {
    constructor() {
        this.status = AdvanceStatus.PENDING;
    }
}
exports.CreateEmployeeCashAdvanceDto = CreateEmployeeCashAdvanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Advance number',
        example: 'ADV-2024-001',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Advance number is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeCashAdvanceDto.prototype, "advanceNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Employee ID',
        example: 'uuid-of-employee',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeCashAdvanceDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request date',
        example: '2024-01-15',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Request date is required' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEmployeeCashAdvanceDto.prototype, "requestDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount requested',
        example: 500000,
        minimum: 0,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeCashAdvanceDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Purpose/reason for advance',
        example: 'Medical emergency',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Purpose is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeCashAdvanceDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Expected repayment date',
        example: '2024-02-15',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEmployeeCashAdvanceDto.prototype, "expectedRepaymentDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of installments',
        example: 2,
        minimum: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateEmployeeCashAdvanceDto.prototype, "installmentCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Advance status',
        enum: AdvanceStatus,
        default: AdvanceStatus.PENDING,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AdvanceStatus, { message: 'Invalid advance status' }),
    __metadata("design:type", String)
], CreateEmployeeCashAdvanceDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeCashAdvanceDto.prototype, "notes", void 0);
//# sourceMappingURL=create-employee-cash-advance.dto.js.map