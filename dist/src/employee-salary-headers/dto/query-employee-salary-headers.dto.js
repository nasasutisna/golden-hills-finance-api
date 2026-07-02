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
exports.QueryEmployeeSalaryHeadersDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
class QueryEmployeeSalaryHeadersDto extends pagination_dto_1.PaginationDto {
}
exports.QueryEmployeeSalaryHeadersDto = QueryEmployeeSalaryHeadersDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by status',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryEmployeeSalaryHeadersDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by employee ID',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryEmployeeSalaryHeadersDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by pay period (YYYY-MM)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryEmployeeSalaryHeadersDto.prototype, "payPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by payment date from',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryEmployeeSalaryHeadersDto.prototype, "paymentDateFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by payment date to',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryEmployeeSalaryHeadersDto.prototype, "paymentDateTo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Search by payroll number',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryEmployeeSalaryHeadersDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by locked status',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], QueryEmployeeSalaryHeadersDto.prototype, "locked", void 0);
//# sourceMappingURL=query-employee-salary-headers.dto.js.map