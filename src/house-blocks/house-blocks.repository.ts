import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HouseBlock } from '@prisma/client';

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
              residentCode: true,
              firstName: true,
              lastName: true,
              email: true,
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

  async findById(id: string): Promise<HouseBlock> {
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
            residentCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            isActive: true,
          },
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
      include: {
        residents: true,
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
      },
    });
  }

  async create(data: any): Promise<HouseBlock> {
    try {
      // Check if coordinatorId is provided and if the resident exists
      if (data.coordinatorId) {
        const coordinator = await this.prisma.resident.findFirst({
          where: {
            id: data.coordinatorId,
            deletedAt: null, // Only check active residents
          },
        });

        if (!coordinator) {
          throw new NotFoundException(`Coordinator (Resident) with ID "${data.coordinatorId}" not found or inactive`);
        }
      }

      return this.prisma.houseBlock.create({
        data,
        include: {
          residents: true,
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
        },
      });
    } catch (error) {
      // Handle unique constraint violations
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
      // Check if blockCode is being updated and if it already exists
      if (data.blockCode) {
        const existingBlock = await this.prisma.houseBlock.findFirst({
          where: {
            blockCode: data.blockCode,
            id: { not: id }, // Exclude the current block
            deletedAt: null, // Only check active blocks
          },
        });

        if (existingBlock) {
          throw new ConflictException(`Block code "${data.blockCode}" already exists`);
        }
      }

      // Check if coordinatorId is being updated and if the resident exists
      if (data.coordinatorId !== undefined && data.coordinatorId !== null) {
        const coordinator = await this.prisma.resident.findFirst({
          where: {
            id: data.coordinatorId,
            deletedAt: null, // Only check active residents
          },
        });

        if (!coordinator) {
          throw new NotFoundException(`Coordinator (Resident) with ID "${data.coordinatorId}" not found or inactive`);
        }
      }

      return await this.prisma.houseBlock.update({
        where: { id },
        data,
        include: {
          residents: true,
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
        },
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

  async softDelete(id: string): Promise<HouseBlock> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
  }

  async restore(id: string): Promise<HouseBlock> {
    return this.prisma.houseBlock.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      include: {
        residents: true,
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
      },
    });
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

  async getActiveBlocksCount(): Promise<number> {
    return this.prisma.houseBlock.count({
      where: { isActive: true, deletedAt: null },
    });
  }

  async getTotalUnits(): Promise<number> {
    const blocks = await this.prisma.houseBlock.findMany({
      where: { deletedAt: null },
      select: { totalUnits: true },
    });

    return blocks.reduce((sum, block) => sum + block.totalUnits, 0);
  }

  async getOccupancyStats(): Promise<{
    totalUnits: number;
    occupiedUnits: number;
    availableUnits: number;
    occupancyRate: number;
  }> {
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
}
