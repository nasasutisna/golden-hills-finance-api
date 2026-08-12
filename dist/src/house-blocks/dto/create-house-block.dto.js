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
exports.CreateHouseBlockDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateHouseBlockDto {
}
exports.CreateHouseBlockDto = CreateHouseBlockDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Block code (unique identifier). Omit to auto-generate BLK-001 sequence.',
        example: 'BLK-001',
        maxLength: 20,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20, { message: 'Block code must not exceed 20 characters' }),
    __metadata("design:type", String)
], CreateHouseBlockDto.prototype, "blockCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Block name',
        example: 'Block A - Residential',
        maxLength: 100,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Block name is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateHouseBlockDto.prototype, "blockName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional description',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHouseBlockDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Coordinator user ID (block coordinator)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHouseBlockDto.prototype, "coordinatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unit IDs to assign to this block (only units without a block are assigned)',
        example: ['123e4567-e89b-12d3-a456-426614174000'],
        required: false,
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateHouseBlockDto.prototype, "assignUnitIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unit IDs to release from this block (set houseBlockId back to null)',
        example: ['123e4567-e89b-12d3-a456-426614174000'],
        required: false,
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateHouseBlockDto.prototype, "unassignUnitIds", void 0);
//# sourceMappingURL=create-house-block.dto.js.map