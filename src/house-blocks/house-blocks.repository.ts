import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(data: any): Promise<HouseBlock> {
    return this.prisma.houseBlock.create({
      data,
      include: { residents: true },
    });
  }

  async update(id: string, data: any): Promise<HouseBlock> {
    try {
      return await this.prisma.houseBlock.update({
        where: { id },
        data,
        include: { residents: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('House block not found');
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
      include: { residents: true },
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
