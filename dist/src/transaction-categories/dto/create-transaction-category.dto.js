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
exports.CreateTransactionCategoryDto = exports.CategoryType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var CategoryType;
(function (CategoryType) {
    CategoryType["INCOME"] = "INCOME";
    CategoryType["EXPENSE"] = "EXPENSE";
})(CategoryType || (exports.CategoryType = CategoryType = {}));
class CreateTransactionCategoryDto {
    constructor() {
        this.isActive = true;
    }
}
exports.CreateTransactionCategoryDto = CreateTransactionCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category code (unique identifier)',
        example: 'CAT001',
        maxLength: 20,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category code is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "categoryCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category name',
        example: 'Service Fee Income',
        maxLength: 100,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category name is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "categoryName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category description',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category type',
        enum: CategoryType,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category type is required' }),
    (0, class_validator_1.IsEnum)(CategoryType, { message: 'Invalid category type' }),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "categoryType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Parent category ID (for sub-categories)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "parentCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Budget code (for budgeting)',
        required: false,
        maxLength: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "budgetCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is category active',
        example: true,
        default: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateTransactionCategoryDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-transaction-category.dto.js.map