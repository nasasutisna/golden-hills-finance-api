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
exports.InventoriesService = void 0;
const common_1 = require("@nestjs/common");
const inventories_repository_1 = require("./inventories.repository");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoriesService = class InventoriesService {
    constructor(repository, prisma) {
        this.repository = repository;
        this.prisma = prisma;
    }
    async create(createInventoryDto) {
        const existing = await this.repository.findByItemCode(createInventoryDto.itemCode);
        if (existing) {
            throw new common_1.ConflictException(`Item with code ${createInventoryDto.itemCode} already exists`);
        }
        return this.repository.create(createInventoryDto);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, itemType, unit, location, search, lowStock } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (itemType) {
            where.itemType = itemType;
        }
        if (unit) {
            where.unit = unit;
        }
        if (location) {
            where.location = location;
        }
        if (lowStock) {
            where.currentStock = { lte: this.prisma.inventory.fields.minStockLevel };
        }
        if (search) {
            where.OR = [
                { itemCode: { contains: search } },
                { itemName: { contains: search } },
                { description: { contains: search } },
            ];
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { itemName: 'asc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const inventory = await this.repository.findById(id);
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory with ID ${id} not found`);
        }
        return inventory;
    }
    async update(id, updateInventoryDto) {
        if (updateInventoryDto.itemCode) {
            const existing = await this.repository.findByItemCode(updateInventoryDto.itemCode);
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Item with code ${updateInventoryDto.itemCode} already exists`);
            }
        }
        return this.repository.update(id, updateInventoryDto);
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.softDelete(id);
    }
    async getLowStockItems() {
        return this.repository.findLowStock();
    }
};
exports.InventoriesService = InventoriesService;
exports.InventoriesService = InventoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventories_repository_1.InventoriesRepository,
        prisma_service_1.PrismaService])
], InventoriesService);
//# sourceMappingURL=inventories.service.js.map