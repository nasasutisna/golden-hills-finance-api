import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HouseUnit } from '@prisma/client';

@Injectable()
export class HouseUnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<{ houseUnits: HouseUnit[]; total: number }> {
    const { skip, take, where, orderBy, include } = params;

    const [houseUnits, total] = await Promise.all([
      this.prisma.houseUnit.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: include || {
          houseBlock: {
            select: {
              id: true,
              blockCode: true,
              blockName: true,
              blockType: true,
              address: true,
            },
          },
          residents: {
            where: { deletedAt: null },
            select: {
              id: true,
              residentCode: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              ownershipType: true,
              isActive: true,
              moveInDate: true,
              moveOutDate: true,
            },
          },
        },
      }),
      this.prisma.houseUnit.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { houseUnits, total };
  }

  async findById(id: string): Promise<HouseUnit> {
    const houseUnit = await this.prisma.houseUnit.findFirst({
      where: { id, deletedAt: null },
      include: {
        houseBlock: {
          select: {
            id: true,
            blockCode: true,
            blockName: true,
            blockType: true,
            address: true,
          },
        },
        residents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!houseUnit) {
      throw new NotFoundException('House unit not found');
    }

    return houseUnit;
  }

  async findByUnitCode(unitCode: string): Promise<HouseUnit | null> {
    return this.prisma.houseUnit.findFirst({
      where: { unitCode, deletedAt: null },
      include: {
        houseBlock: {
          select: {
            id: true,
            blockCode: true,
            blockName: true,
            blockType: true,
            address: true,
          },
        },
        residents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByHouseBlock(houseBlockId: string): Promise<HouseUnit[]> {
    return this.prisma.houseUnit.findMany({
      where: { houseBlockId, deletedAt: null },
      include: {
        residents: {
          where: { deletedAt: null },
          select: {
            id: true,
            residentCode: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            ownershipType: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ floorNumber: 'asc' }, { unitNumber: 'asc' }],
    });
  }

  async create(data: any): Promise<HouseUnit> {
    return this.prisma.houseUnit.create({
      data,
      include: {
        houseBlock: {
          select: {
            id: true,
            blockCode: true,
            blockName: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any): Promise<HouseUnit> {
    try {
      return await this.prisma.houseUnit.update({
        where: { id },
        data,
        include: {
          houseBlock: {
            select: {
              id: true,
              blockCode: true,
              blockName: true,
            },
          },
          residents: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('House unit not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<HouseUnit> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
  }

  async restore(id: string): Promise<HouseUnit> {
    return this.prisma.houseUnit.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      include: {
        houseBlock: {
          select: {
            id: true,
            blockCode: true,
            blockName: true,
          },
        },
        residents: true,
      },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.houseUnit.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.houseUnit.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getOccupancyStats(): Promise<{
    totalUnits: number;
    fullyOccupied: number;
    occasionally: number;
    vacant: number;
    rented: number;
    bankBuyback: number;
  }> {
    const [totalUnits, fullyOccupied, occasionally, vacant, rented, bankBuyback] = await Promise.all([
      this.prisma.houseUnit.count({ where: { deletedAt: null } }),
      this.prisma.houseUnit.count({ where: { occupancyStatus: 'FULLY_OCCUPIED', deletedAt: null } }),
      this.prisma.houseUnit.count({ where: { occupancyStatus: 'OCCASIONALLY', deletedAt: null } }),
      this.prisma.houseUnit.count({ where: { occupancyStatus: 'VACANT', deletedAt: null } }),
      this.prisma.houseUnit.count({ where: { occupancyStatus: 'RENTED', deletedAt: null } }),
      this.prisma.houseUnit.count({ where: { isBankBuyback: true, deletedAt: null } }),
    ]);

    return {
      totalUnits,
      fullyOccupied,
      occasionally,
      vacant,
      rented,
      bankBuyback,
    };
  }

  async getUnitsByOccupancyStatus(occupancyStatus: string): Promise<HouseUnit[]> {
    return this.prisma.houseUnit.findMany({
      where: { occupancyStatus, deletedAt: null },
      include: {
        houseBlock: {
          select: {
            id: true,
            blockCode: true,
            blockName: true,
          },
        },
        residents: {
          where: { deletedAt: null, isActive: true },
          select: {
            id: true,
            residentCode: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: [{ houseBlock: { blockCode: 'asc' } }, { unitNumber: 'asc' }],
    });
  }

  async getBankBuybackUnits(): Promise<HouseUnit[]> {
    return this.prisma.houseUnit.findMany({
      where: { isBankBuyback: true, deletedAt: null },
      include: {
        houseBlock: {
          select: {
            id: true,
            blockCode: true,
            blockName: true,
          },
        },
        residents: {
          where: { deletedAt: null },
          select: {
            id: true,
            residentCode: true,
            firstName: true,
            lastName: true,
            ownershipType: true,
          },
        },
      },
      orderBy: [{ buybackDate: 'desc' }],
    });
  }
}
