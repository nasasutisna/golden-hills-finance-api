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
exports.CreateEmployeeSalaryDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateEmployeeSalaryDetailDto {
    constructor() {
        this.manualOverride = false;
    }
}
exports.CreateEmployeeSalaryDetailDto = CreateEmployeeSalaryDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Salary header ID',
        example: 'uuid-of-salary-header',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Salary header is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeSalaryDetailDto.prototype, "salaryHeaderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Salary component ID',
        example: 'uuid-of-salary-component',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Salary component is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeSalaryDetailDto.prototype, "componentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount',
        example: 5000000,
        minimum: 0,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryDetailDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantity',
        example: 1,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeSalaryDetailDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is manual override',
        example: false,
        default: false,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateEmployeeSalaryDetailDto.prototype, "manualOverride", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeSalaryDetailDto.prototype, "notes", void 0);
//# sourceMappingURL=create-employee-salary-detail.dto.js.map