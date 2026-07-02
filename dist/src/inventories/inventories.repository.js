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
exports.InventoriesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoriesRepository = class InventoriesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [inventories, total] = await Promise.all([
            this.prisma.inventory.findMany({
                where,
                skip,
                take,
                orderBy,
            }),
            this.prisma.inventory.count({ where }),
        ]);
        return { inventories, total };
    }
    async findById(id) {
        return this.prisma.inventory.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async findByItemCode(itemCode) {
        return this.prisma.inventory.findFirst({
            where: { itemCode, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.inventory.create({
            data,
        });
    }
    async update(id, data) {
        const inventory = await this.findById(id);
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory with ID ${id} not found`);
        }
        return this.prisma.inventory.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        const inventory = await this.findById(id);
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory with ID ${id} not found`);
        }
        return this.prisma.inventory.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async findLowStock() {
        return this.prisma.inventory.findMany({
            where: {
                deletedAt: null,
                currentStock: { lte: this.prisma.inventory.fields.minStockLevel },
            },
        });
    }
    async count(where) {
        return this.prisma.inventory.count({ where });
    }
};
exports.InventoriesRepository = InventoriesRepository;
exports.InventoriesRepository = InventoriesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoriesRepository);
//# sourceMappingURL=inventories.repository.js.map