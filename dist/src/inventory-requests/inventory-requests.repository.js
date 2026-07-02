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
exports.InventoryRequestsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryRequestsRepository = class InventoryRequestsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [requests, total] = await Promise.all([
            this.prisma.inventoryRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    inventory: {
                        select: {
                            id: true,
                            itemCode: true,
                            itemName: true,
                            itemType: true,
                            unit: true,
                            currentStock: true,
                        },
                    },
                },
            }),
            this.prisma.inventoryRequest.count({ where }),
        ]);
        return { requests, total };
    }
    async findById(id) {
        return this.prisma.inventoryRequest.findFirst({
            where: { id, deletedAt: null },
            include: {
                inventory: true,
            },
        });
    }
    async findByRequestNumber(requestNumber) {
        return this.prisma.inventoryRequest.findFirst({
            where: { requestNumber, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.inventoryRequest.create({
            data,
            include: {
                inventory: true,
            },
        });
    }
    async update(id, data) {
        const request = await this.findById(id);
        if (!request) {
            throw new common_1.NotFoundException(`Inventory request with ID ${id} not found`);
        }
        return this.prisma.inventoryRequest.update({
            where: { id },
            data,
            include: {
                inventory: true,
            },
        });
    }
    async softDelete(id) {
        const request = await this.findById(id);
        if (!request) {
            throw new common_1.NotFoundException(`Inventory request with ID ${id} not found`);
        }
        return this.prisma.inventoryRequest.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async findByStatus(status) {
        return this.prisma.inventoryRequest.findMany({
            where: { status, deletedAt: null },
            include: {
                inventory: true,
            },
            orderBy: { requestDate: 'desc' },
        });
    }
    async count(where) {
        return this.prisma.inventoryRequest.count({ where });
    }
};
exports.InventoryRequestsRepository = InventoryRequestsRepository;
exports.InventoryRequestsRepository = InventoryRequestsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryRequestsRepository);
//# sourceMappingURL=inventory-requests.repository.js.map