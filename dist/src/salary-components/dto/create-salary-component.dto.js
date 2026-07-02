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
exports.CreateSalaryComponentDto = exports.CalculationType = exports.ComponentType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ComponentType;
(function (ComponentType) {
    ComponentType["BASIC"] = "BASIC";
    ComponentType["ALLOWANCE"] = "ALLOWANCE";
    ComponentType["DEDUCTION"] = "DEDUCTION";
    ComponentType["BONUS"] = "BONUS";
    ComponentType["OVERTIME"] = "OVERTIME";
    ComponentType["TAX"] = "TAX";
    ComponentType["INSURANCE"] = "INSURANCE";
    ComponentType["OTHER"] = "OTHER";
})(ComponentType || (exports.ComponentType = ComponentType = {}));
var CalculationType;
(function (CalculationType) {
    CalculationType["FIXED"] = "FIXED";
    CalculationType["PERCENTAGE"] = "PERCENTAGE";
    CalculationType["FORMULA"] = "FORMULA";
})(CalculationType || (exports.CalculationType = CalculationType = {}));
class CreateSalaryComponentDto {
    constructor() {
        this.isTaxSubject = true;
        this.isActive = true;
    }
}
exports.CreateSalaryComponentDto = CreateSalaryComponentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Component code',
        example: 'BASIC',
        maxLength: 50,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Component code is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "componentCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Component name',
        example: 'Basic Salary',
        maxLength: 100,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Component name is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "componentName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Component description',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Component type',
        enum: ComponentType,
        example: ComponentType.BASIC,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Component type is required' }),
    (0, class_validator_1.IsEnum)(ComponentType, { message: 'Invalid component type' }),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "componentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Calculation type',
        enum: CalculationType,
        example: CalculationType.FIXED,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Calculation type is required' }),
    (0, class_validator_1.IsEnum)(CalculationType, { message: 'Invalid calculation type' }),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "calculationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Default value (for FIXED type)',
        example: 5000000,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryComponentDto.prototype, "defaultValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Percentage value (for PERCENTAGE type)',
        example: 5,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryComponentDto.prototype, "percentageValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Formula (for FORMULA type)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "formula", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is tax subject',
        example: true,
        default: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSalaryComponentDto.prototype, "isTaxSubject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Calculation order',
        example: 1,
        minimum: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSalaryComponentDto.prototype, "calculationOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is active',
        example: true,
        default: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSalaryComponentDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account code for accounting integration',
        maxLength: 50,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "accountCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-salary-component.dto.js.map