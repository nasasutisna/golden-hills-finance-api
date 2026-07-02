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
exports.CreateResidentInvoiceDto = exports.InvoiceStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["PENDING"] = "PENDING";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["PARTIAL"] = "PARTIAL";
    InvoiceStatus["OVERDUE"] = "OVERDUE";
    InvoiceStatus["CANCELLED"] = "CANCELLED";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
class CreateResidentInvoiceDto {
}
exports.CreateResidentInvoiceDto = CreateResidentInvoiceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resident ID',
        example: 'uuid-of-resident',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Resident is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResidentInvoiceDto.prototype, "residentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fee Type ID',
        example: 'uuid-of-fee-type',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Fee type is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResidentInvoiceDto.prototype, "feeTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Invoice date',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Invoice date is required' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResidentInvoiceDto.prototype, "invoiceDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Due date',
        example: '2024-01-31',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Due date is required' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResidentInvoiceDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Period start date',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Period start date is required' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResidentInvoiceDto.prototype, "periodStartDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Period end date',
        example: '2024-01-31',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Period end date is required' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResidentInvoiceDto.prototype, "periodEndDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subtotal amount',
        example: 500000,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Subtotal is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateResidentInvoiceDto.prototype, "subtotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tax amount',
        example: 50000,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateResidentInvoiceDto.prototype, "taxAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Discount amount',
        example: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateResidentInvoiceDto.prototype, "discountAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateResidentInvoiceDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created by (user ID)',
        example: 'uuid-of-user',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Creator is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResidentInvoiceDto.prototype, "createdBy", void 0);
//# sourceMappingURL=create-resident-invoice.dto.js.map