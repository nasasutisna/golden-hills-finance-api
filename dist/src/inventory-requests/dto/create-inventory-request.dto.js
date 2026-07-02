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
exports.CreateInventoryRequestDto = exports.RequestPriority = exports.RequestStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["APPROVED"] = "APPROVED";
    RequestStatus["REJECTED"] = "REJECTED";
    RequestStatus["COMPLETED"] = "COMPLETED";
    RequestStatus["CANCELLED"] = "CANCELLED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var RequestPriority;
(function (RequestPriority) {
    RequestPriority["LOW"] = "LOW";
    RequestPriority["MEDIUM"] = "MEDIUM";
    RequestPriority["HIGH"] = "HIGH";
    RequestPriority["URGENT"] = "URGENT";
})(RequestPriority || (exports.RequestPriority = RequestPriority = {}));
class CreateInventoryRequestDto {
    constructor() {
        this.priority = RequestPriority.MEDIUM;
        this.status = RequestStatus.PENDING;
    }
}
exports.CreateInventoryRequestDto = CreateInventoryRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request number',
        example: 'REQ-2024-001',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Request number is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "requestNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Inventory item ID',
        example: 'uuid-of-inventory-item',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Inventory item is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "inventoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Requested quantity',
        example: 50,
        minimum: 1,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Requested quantity is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateInventoryRequestDto.prototype, "requestedQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request date',
        example: '2024-01-15',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Request date is required' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "requestDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Required date',
        example: '2024-01-20',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "requiredDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Purpose/reason for request',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Department requesting',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request priority',
        enum: RequestPriority,
        default: RequestPriority.MEDIUM,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RequestPriority, { message: 'Invalid request priority' }),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status',
        enum: RequestStatus,
        default: RequestStatus.PENDING,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RequestStatus, { message: 'Invalid status' }),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notes or additional information',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryRequestDto.prototype, "notes", void 0);
//# sourceMappingURL=create-inventory-request.dto.js.map