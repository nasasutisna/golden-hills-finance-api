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
exports.CreateApprovalHistoryDto = exports.ApprovalAction = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ApprovalAction;
(function (ApprovalAction) {
    ApprovalAction["CREATED"] = "CREATED";
    ApprovalAction["SUBMITTED"] = "SUBMITTED";
    ApprovalAction["APPROVED"] = "APPROVED";
    ApprovalAction["REJECTED"] = "REJECTED";
    ApprovalAction["CANCELLED"] = "CANCELLED";
})(ApprovalAction || (exports.ApprovalAction = ApprovalAction = {}));
class CreateApprovalHistoryDto {
}
exports.CreateApprovalHistoryDto = CreateApprovalHistoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Entity type (e.g., CashTransaction, InventoryRequest)',
        example: 'CashTransaction',
        maxLength: 50,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Entity type is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Entity ID',
        example: 'uuid-of-entity',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Entity ID is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action performed',
        enum: ApprovalAction,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Action is required' }),
    (0, class_validator_1.IsEnum)(ApprovalAction, { message: 'Invalid action' }),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Previous status',
        maxLength: 20,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "fromStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New status',
        maxLength: 20,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'To status is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "toStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Comments or notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Creator user ID',
        example: 'uuid-of-user',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Created by is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Approver user ID',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "approvedBy", void 0);
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
], CreateApprovalHistoryDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User agent',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateApprovalHistoryDto.prototype, "userAgent", void 0);
//# sourceMappingURL=create-approval-history.dto.js.map