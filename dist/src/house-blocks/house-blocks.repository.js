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
exports.HouseBlocksRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HouseBlocksRepository = class HouseBlocksRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy, include } = params;
        const [houseBlocks, total] = await Promise.all([
            this.prisma.houseBlock.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: include || {
                    residents: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            residentCode: true,
                            firstName: true,
                            lastName: true,
                            unitNumber: true,
                            isActive: true,
                        },
                    },
                    coordinator: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phoneNumber: true,
                            isActive: true,
                        },
                    },
                },
            }),
            this.prisma.houseBlock.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { houseBlocks, total };
    }
    async findById(id) {
        const houseBlock = await this.prisma.houseBlock.findFirst({
            where: { id, deletedAt: null },
            include: {
                residents: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        residentCode: true,
                        firstName: true,
                        lastName: true,
                        unitNumber: true,
                        ownershipType: true,
                        isActive: true,
                    },
                    orderBy: { unitNumber: 'asc' },
                },
                coordinator: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                        isActive: true,
                    },
                },
            },
        });
        if (!houseBlock) {
            throw new common_1.NotFoundException('House block not found');
        }
        return houseBlock;
    }
    async findByBlockCode(blockCode) {
        return this.prisma.houseBlock.findFirst({
            where: { blockCode, deletedAt: null },
            include: {
                residents: true,
                coordinator: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                        isActive: true,
                    },
                },
            },
        });
    }
    async create(data) {
        return this.prisma.houseBlock.create({
            data,
            include: { residents: true },
        });
    }
    async update(id, data) {
        try {
            return await this.prisma.houseBlock.update({
                where: { id },
                data,
                include: { residents: true },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('House block not found');
            }
            throw error;
        }
    }
    async softDelete(id) {
        return this.update(id, {
            deletedAt: new Date(),
            isActive: false,
        });
    }
    async restore(id) {
        return this.prisma.houseBlock.update({
            where: { id },
            data: { deletedAt: null, isActive: true },
            include: { residents: true },
        });
    }
    async count(where) {
        return this.prisma.houseBlock.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.houseBlock.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
    async getActiveBlocksCount() {
        return this.prisma.houseBlock.count({
            where: { isActive: true, deletedAt: null },
        });
    }
    async getTotalUnits() {
        const blocks = await this.prisma.houseBlock.findMany({
            where: { deletedAt: null },
            select: { totalUnits: true },
        });
        return blocks.reduce((sum, block) => sum + block.totalUnits, 0);
    }
    async getOccupancyStats() {
        const totalUnits = await this.getTotalUnits();
        const occupiedUnits = await this.prisma.resident.count({
            where: {
                isActive: true,
                deletedAt: null,
                moveOutDate: null,
            },
        });
        const availableUnits = totalUnits - occupiedUnits;
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
        return {
            totalUnits,
            occupiedUnits,
            availableUnits,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
        };
    }
};
exports.HouseBlocksRepository = HouseBlocksRepository;
exports.HouseBlocksRepository = HouseBlocksRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HouseBlocksRepository);
//# sourceMappingURL=house-blocks.repository.js.map