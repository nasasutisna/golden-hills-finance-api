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
exports.CreateCashTransactionDto = exports.ApprovalStatus = exports.TransactionType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const reference_types_1 = require("../../common/constants/reference-types");
var TransactionType;
(function (TransactionType) {
    TransactionType["INCOME"] = "INCOME";
    TransactionType["EXPENSE"] = "EXPENSE";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "PENDING";
    ApprovalStatus["APPROVED"] = "APPROVED";
    ApprovalStatus["REJECTED"] = "REJECTED";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
class CreateCashTransactionDto {
    constructor() {
        this.requiresApproval = false;
    }
}
exports.CreateCashTransactionDto = CreateCashTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction date',
        example: '2024-01-15',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Transaction date is required' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "transactionDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction type',
        enum: TransactionType,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Transaction type is required' }),
    (0, class_validator_1.IsEnum)(TransactionType, { message: 'Invalid transaction type' }),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "transactionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category ID',
        example: 'uuid-of-category',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction amount',
        example: 500000,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCashTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payment method',
        example: 'TRANSFER',
        enum: ['CASH', 'TRANSFER', 'CARD'],
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Payment method is required' }),
    (0, class_validator_1.IsEnum)(['CASH', 'TRANSFER', 'CARD'], { message: 'Invalid payment method' }),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reference type (IPL_PAYMENT, KEGIATAN_PAYMENT, IPL_EXPENSE, KEGIATAN_EXPENSE, etc.)',
        example: 'IPL_EXPENSE',
        enum: reference_types_1.REFERENCE_TYPE_OPTIONS,
        maxLength: 50,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_validator_1.IsIn)(reference_types_1.REFERENCE_TYPE_OPTIONS, { message: 'Invalid reference type' }),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "referenceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reference ID (optional)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "referenceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reference number (optional)',
        maxLength: 100,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "referenceNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction description',
        example: 'Monthly maintenance fee payment',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Description is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Requires approval',
        example: true,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCashTransactionDto.prototype, "requiresApproval", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'IP address',
        required: false,
        maxLength: 45,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(45),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User agent',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "userAgent", void 0);
//# sourceMappingURL=create-cash-transaction.dto.js.map