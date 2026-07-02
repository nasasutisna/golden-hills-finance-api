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
exports.QueryEmployeeSalaryDetailsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
class QueryEmployeeSalaryDetailsDto extends pagination_dto_1.PaginationDto {
}
exports.QueryEmployeeSalaryDetailsDto = QueryEmployeeSalaryDetailsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by salary header ID',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryEmployeeSalaryDetailsDto.prototype, "salaryHeaderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by salary component ID',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryEmployeeSalaryDetailsDto.prototype, "salaryComponentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by manual override',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], QueryEmployeeSalaryDetailsDto.prototype, "manualOverride", void 0);
//# sourceMappingURL=query-employee-salary-details.dto.js.map