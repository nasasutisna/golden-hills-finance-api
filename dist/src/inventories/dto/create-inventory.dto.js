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
exports.CreateInventoryDto = exports.InventoryUnit = exports.InventoryItemType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var InventoryItemType;
(function (InventoryItemType) {
    InventoryItemType["CONSUMABLE"] = "CONSUMABLE";
    InventoryItemType["FIXED_ASSET"] = "FIXED_ASSET";
    InventoryItemType["EQUIPMENT"] = "EQUIPMENT";
    InventoryItemType["OFFICE_SUPPLIES"] = "OFFICE_SUPPLIES";
    InventoryItemType["MAINTENANCE"] = "MAINTENANCE";
    InventoryItemType["OTHER"] = "OTHER";
})(InventoryItemType || (exports.InventoryItemType = InventoryItemType = {}));
var InventoryUnit;
(function (InventoryUnit) {
    InventoryUnit["PCS"] = "PCS";
    InventoryUnit["BOX"] = "BOX";
    InventoryUnit["UNIT"] = "UNIT";
    InventoryUnit["KG"] = "KG";
    InventoryUnit["LITER"] = "LITER";
    InventoryUnit["METER"] = "METER";
    InventoryUnit["PACK"] = "PACK";
    InventoryUnit["SET"] = "SET";
})(InventoryUnit || (exports.InventoryUnit = InventoryUnit = {}));
class CreateInventoryDto {
}
exports.CreateInventoryDto = CreateInventoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Item code',
        example: 'INV001',
        maxLength: 50,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Item code is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Item name',
        example: 'Office Chair',
        maxLength: 200,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Item name is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "itemName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Item description',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Item type',
        enum: InventoryItemType,
        example: InventoryItemType.OFFICE_SUPPLIES,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Item type is required' }),
    (0, class_validator_1.IsEnum)(InventoryItemType, { message: 'Invalid item type' }),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "itemType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unit of measure',
        enum: InventoryUnit,
        example: InventoryUnit.UNIT,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Unit of measure is required' }),
    (0, class_validator_1.IsEnum)(InventoryUnit, { message: 'Invalid unit of measure' }),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current stock quantity',
        example: 100,
        minimum: 0,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Current stock is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "currentStock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Minimum stock level for reorder',
        example: 20,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "minStockLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Maximum stock level',
        example: 500,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "maxStockLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reorder quantity',
        example: 100,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "reorderQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unit cost',
        example: 150000,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "unitCost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Location/warehouse',
        maxLength: 100,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Supplier name',
        maxLength: 200,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "supplier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Supplier contact',
        maxLength: 100,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "supplierContact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "notes", void 0);
//# sourceMappingURL=create-inventory.dto.js.map