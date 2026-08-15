import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HouseBlock } from '@prisma/client';
import { generateBlockCode } from './helpers/block-code.helper';

// Shared relation includes for consistent HouseBlock responses
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

@Injectable()
export class HouseBlocksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<{ houseBlocks: HouseBlock[]; total: number }> {
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

  async findById(id: string): Promise<HouseBlock> {
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
      throw new NotFoundException('House block not found');
    }

    return houseBlock;
  }

  async findByBlockCode(blockCode: string): Promise<HouseBlock | null> {
    return this.prisma.houseBlock.findFirst({
      where: { blockCode, deletedAt: null },
      include: HOUSE_BLOCK_INCLUDE,
    });
  }

  async create(data: any): Promise<HouseBlock> {
    try {
      const { assignUnitIds, unassignUnitIds, ...blockData } = data;

      // Auto-generate block code when not provided (BLK-001 sequence)
      if (!blockData.blockCode) {
        blockData.blockCode = await generateBlockCode(this.prisma);
      }

      // Check if coordinatorId is provided and if the resident exists
      if (blockData.coordinatorId) {
        const coordinator = await this.prisma.resident.findFirst({
          where: {
            id: blockData.coordinatorId,
            deletedAt: null, // Only check active residents
          },
        });

        if (!coordinator) {
          throw new NotFoundException(`Coordinator (Resident) with ID "${blockData.coordinatorId}" not found or inactive`);
        }
      }

      // Atomic: create block + assign units in one transaction
      return await this.prisma.$transaction(async (tx) => {
        const houseBlock = await tx.houseBlock.create({
          data: blockData,
        });

        // Assign units (guard: only units currently WITHOUT a block)
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

        // Re-fetch with relations so response reflects assigned units
        return (await tx.houseBlock.findUnique({
          where: { id: houseBlock.id },
          include: HOUSE_BLOCK_INCLUDE,
        })) as HouseBlock;
      });
    } catch (error) {
      // Handle unique constraint violations (block_code or unit_code)
      if (error.code === 'P2002' && error.meta?.target?.includes('block_code')) {
        throw new ConflictException(`Block code "${data.blockCode}" already exists`);
      }
      // Handle foreign key constraint violations
      if (error.code === 'P2003' && error.meta?.field_name?.includes('coordinator_id')) {
        throw new NotFoundException(`Coordinator (Resident) with ID "${data.coordinatorId}" not found`);
      }
      // Re-throw NotFoundException
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async update(id: string, data: any): Promise<HouseBlock> {
    try {
      const { assignUnitIds, unassignUnitIds, ...blockData } = data;

      // Check if blockCode is being updated and if it already exists
      if (blockData.blockCode) {
        const existingBlock = await this.prisma.houseBlock.findFirst({
          where: {
            blockCode: blockData.blockCode,
            id: { not: id }, // Exclude the current block
            deletedAt: null, // Only check active blocks
          },
        });

        if (existingBlock) {
          throw new ConflictException(`Block code "${blockData.blockCode}" already exists`);
        }
      }

      // Check if coordinatorId is being updated and if the resident exists
      if (blockData.coordinatorId !== undefined && blockData.coordinatorId !== null) {
        const coordinator = await this.prisma.resident.findFirst({
          where: {
            id: blockData.coordinatorId,
            deletedAt: null, // Only check active residents
          },
        });

        if (!coordinator) {
          throw new NotFoundException(`Coordinator (Resident) with ID "${blockData.coordinatorId}" not found or inactive`);
        }
      }

      // Atomic: update block + assign/release units in one transaction
      return await this.prisma.$transaction(async (tx) => {
        await tx.houseBlock.update({
          where: { id },
          data: blockData,
        });

        // Assign units (guard: only units currently WITHOUT a block — anti-rebut)
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

        // Release units (guard: only units currently IN this block — anti-salah-lepas)
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
        })) as HouseBlock;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('House block not found');
      }
      // Handle unique constraint violations
      if (error.code === 'P2002' && error.meta?.target?.includes('block_code')) {
        throw new ConflictException(`Block code "${data.blockCode}" already exists`);
      }
      // Handle foreign key constraint violations
      if (error.code === 'P2003' && error.meta?.field_name?.includes('coordinator_id')) {
        throw new NotFoundException(`Coordinator (Resident) with ID "${data.coordinatorId}" not found`);
      }
      // Re-throw our custom exceptions
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async remove(id: string): Promise<HouseBlock> {
    // Hard delete. The schema's onDelete: SetNull on HouseUnit.houseBlock and
    // Resident.houseBlock makes the DB null those FKs automatically, releasing
    // the units/residents so they can be assigned to other blocks — no manual
    // detach needed.
    try {
      return await this.prisma.houseBlock.delete({
        where: { id },
        include: HOUSE_BLOCK_INCLUDE,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('House block not found');
      }
      throw error;
    }
  }

  async count(where?: any): Promise<number> {
    return this.prisma.houseBlock.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.houseBlock.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  /**
   * Total units = actual HouseUnit rows (not a manual counter on the block).
   */
  async getTotalUnits(): Promise<number> {
    return this.prisma.houseUnit.count({
      where: { deletedAt: null },
    });
  }

  async getOccupancyStats(): Promise<{
    totalBlocks: number;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
  }> {
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
}
