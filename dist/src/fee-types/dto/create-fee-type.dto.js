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
exports.CreateFeeTypeDto = exports.RecurringPeriod = exports.FeeCategory = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var FeeCategory;
(function (FeeCategory) {
    FeeCategory["MAINTENANCE"] = "MAINTENANCE";
    FeeCategory["UTILITIES"] = "UTILITIES";
    FeeCategory["SECURITY"] = "SECURITY";
    FeeCategory["OTHERS"] = "OTHERS";
})(FeeCategory || (exports.FeeCategory = FeeCategory = {}));
var RecurringPeriod;
(function (RecurringPeriod) {
    RecurringPeriod["MONTHLY"] = "MONTHLY";
    RecurringPeriod["QUARTERLY"] = "QUARTERLY";
    RecurringPeriod["YEARLY"] = "YEARLY";
})(RecurringPeriod || (exports.RecurringPeriod = RecurringPeriod = {}));
class CreateFeeTypeDto {
    constructor() {
        this.isRecurring = false;
        this.isTaxable = false;
        this.isActive = true;
    }
}
exports.CreateFeeTypeDto = CreateFeeTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fee code (unique identifier)',
        example: 'FEE001',
        maxLength: 20,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Fee code is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateFeeTypeDto.prototype, "feeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fee name',
        example: 'Monthly Maintenance Fee',
        maxLength: 100,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Fee name is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateFeeTypeDto.prototype, "feeName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fee description',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeeTypeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fee category',
        enum: FeeCategory,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Fee category is required' }),
    (0, class_validator_1.IsEnum)(FeeCategory, { message: 'Invalid fee category' }),
    __metadata("design:type", String)
], CreateFeeTypeDto.prototype, "feeCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is recurring fee',
        example: true,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeeTypeDto.prototype, "isRecurring", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recurring period',
        enum: RecurringPeriod,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RecurringPeriod, { message: 'Invalid recurring period' }),
    __metadata("design:type", String)
], CreateFeeTypeDto.prototype, "recurrencePeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is taxable',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeeTypeDto.prototype, "isTaxable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tax rate (%)',
        example: 10,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateFeeTypeDto.prototype, "taxRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Default amount',
        example: 500000,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateFeeTypeDto.prototype, "defaultAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is fee type active',
        example: true,
        default: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeeTypeDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-fee-type.dto.js.map