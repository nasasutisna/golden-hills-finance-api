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
const block_code_helper_1 = require("./helpers/block-code.helper");
const HOUSE_BLOCK_INCLUDE = {
    units: {
        where: { deletedAt: null },
        select: {
            id: true,
            unitCode: true,
            unitNumber: true,
            unitType: true,
            landArea: true,
            buildingArea: true,
            occupancyStatus: true,
            isActive: true,
        },
    },
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
            residentCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            isActive: true,
        },
    },
};
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
                include: include || HOUSE_BLOCK_INCLUDE,
            }),
            this.prisma.houseBlock.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { houseBlocks, total };
    }
    async findById(id) {
        const houseBlock = await this.prisma.houseBlock.findFirst({
            where: { id, deletedAt: null },
            include: {
                ...HOUSE_BLOCK_INCLUDE,
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
            include: HOUSE_BLOCK_INCLUDE,
        });
    }
    async create(data) {
        try {
            const { assignUnitIds, unassignUnitIds, ...blockData } = data;
            if (!blockData.blockCode) {
                blockData.blockCode = await (0, block_code_helper_1.generateBlockCode)(this.prisma);
            }
            if (blockData.coordinatorId) {
                const coordinator = await this.prisma.resident.findFirst({
                    where: {
                        id: blockData.coordinatorId,
                        deletedAt: null,
                    },
                });
                if (!coordinator) {
                    throw new common_1.NotFoundException(`Coordinator (Resident) with ID "${blockData.coordinatorId}" not found or inactive`);
                }
            }
            return await this.prisma.$transaction(async (tx) => {
                const houseBlock = await tx.houseBlock.create({
                    data: blockData,
                });
                if (assignUnitIds?.length) {
                    await tx.houseUnit.updateMany({
                        where: {
                            id: { in: assignUnitIds },
                            houseBlockId: null,
                            deletedAt: null,
                        },
                        data: { houseBlockId: houseBlock.id },
                    });
                }
                return (await tx.houseBlock.findUnique({
                    where: { id: houseBlock.id },
                    include: HOUSE_BLOCK_INCLUDE,
                }));
            });
        }
        catch (error) {
            if (error.code === 'P2002' && error.meta?.target?.includes('block_code')) {
                throw new common_1.ConflictException(`Block code "${data.blockCode}" already exists`);
            }
            if (error.code === 'P2003' && error.meta?.field_name?.includes('coordinator_id')) {
                throw new common_1.NotFoundException(`Coordinator (Resident) with ID "${data.coordinatorId}" not found`);
            }
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw error;
        }
    }
    async update(id, data) {
        try {
            const { assignUnitIds, unassignUnitIds, ...blockData } = data;
            if (blockData.blockCode) {
                const existingBlock = await this.prisma.houseBlock.findFirst({
                    where: {
                        blockCode: blockData.blockCode,
                        id: { not: id },
                        deletedAt: null,
                    },
                });
                if (existingBlock) {
                    throw new common_1.ConflictException(`Block code "${blockData.blockCode}" already exists`);
                }
            }
            if (blockData.coordinatorId !== undefined && blockData.coordinatorId !== null) {
                const coordinator = await this.prisma.resident.findFirst({
                    where: {
                        id: blockData.coordinatorId,
                        deletedAt: null,
                    },
                });
                if (!coordinator) {
                    throw new common_1.NotFoundException(`Coordinator (Resident) with ID "${blockData.coordinatorId}" not found or inactive`);
                }
            }
            return await this.prisma.$transaction(async (tx) => {
                await tx.houseBlock.update({
                    where: { id },
                    data: blockData,
                });
                if (assignUnitIds?.length) {
                    await tx.houseUnit.updateMany({
                        where: {
                            id: { in: assignUnitIds },
                            houseBlockId: null,
                            deletedAt: null,
                        },
                        data: { houseBlockId: id },
                    });
                }
                if (unassignUnitIds?.length) {
                    await tx.houseUnit.updateMany({
                        where: {
                            id: { in: unassignUnitIds },
                            houseBlockId: id,
                            deletedAt: null,
                        },
                        data: { houseBlockId: null },
                    });
                }
                return (await tx.houseBlock.findUnique({
                    where: { id },
                    include: HOUSE_BLOCK_INCLUDE,
                }));
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('House block not found');
            }
            if (error.code === 'P2002' && error.meta?.target?.includes('block_code')) {
                throw new common_1.ConflictException(`Block code "${data.blockCode}" already exists`);
            }
            if (error.code === 'P2003' && error.meta?.field_name?.includes('coordinator_id')) {
                throw new common_1.NotFoundException(`Coordinator (Resident) with ID "${data.coordinatorId}" not found`);
            }
            if (error instanceof common_1.ConflictException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            return await this.prisma.houseBlock.delete({
                where: { id },
                include: HOUSE_BLOCK_INCLUDE,
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('House block not found');
            }
            throw error;
        }
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
    async getTotalUnits() {
        return this.prisma.houseUnit.count({
            where: { deletedAt: null },
        });
    }
    async getOccupancyStats() {
        const [totalBlocks, totalUnits, occupiedUnits] = await Promise.all([
            this.prisma.houseBlock.count({ where: { deletedAt: null } }),
            this.getTotalUnits(),
            this.prisma.resident.count({
                where: {
                    isActive: true,
                    deletedAt: null,
                    moveOutDate: null,
                },
            }),
        ]);
        const vacantUnits = Math.max(0, totalUnits - occupiedUnits);
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
        return {
            totalBlocks,
            totalUnits,
            occupiedUnits,
            vacantUnits,
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