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
exports.CreateHouseBlockDto = exports.BlockType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var BlockType;
(function (BlockType) {
    BlockType["RESIDENTIAL"] = "RESIDENTIAL";
    BlockType["COMMERCIAL"] = "COMMERCIAL";
    BlockType["MIXED"] = "MIXED";
})(BlockType || (exports.BlockType = BlockType = {}));
class CreateHouseBlockDto {
    constructor() {
        this.totalUnits = 0;
    }
}
exports.CreateHouseBlockDto = CreateHouseBlockDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Block code (unique identifier)',
        example: 'BLK-A',
        maxLength: 20,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Block code is required' }),
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
        description: 'Block type',
        enum: BlockType,
        default: BlockType.RESIDENTIAL,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Block type is required' }),
    (0, class_validator_1.IsEnum)(BlockType, { message: 'Invalid block type' }),
    __metadata("design:type", String)
], CreateHouseBlockDto.prototype, "blockType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Address',
        example: 'Jalan Golden Hills Block A',
        maxLength: 255,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateHouseBlockDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of units',
        example: 24,
        default: 0,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Total units is required' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateHouseBlockDto.prototype, "totalUnits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of floors',
        example: 4,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateHouseBlockDto.prototype, "totalFloors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Construction year',
        example: 2020,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1900),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateHouseBlockDto.prototype, "constructionYear", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Land area in square meters',
        example: 2000,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateHouseBlockDto.prototype, "landArea", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Building area in square meters',
        example: 1500,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateHouseBlockDto.prototype, "buildingArea", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Facilities (JSON object)',
        example: '{"parking": true, "gym": true, "pool": true}',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateHouseBlockDto.prototype, "facilities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional amenities',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHouseBlockDto.prototype, "amenities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is block active',
        example: true,
        default: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateHouseBlockDto.prototype, "isActive", void 0);
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
//# sourceMappingURL=create-house-block.dto.js.map