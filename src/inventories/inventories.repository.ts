import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Inventory } from '@prisma/client';

@Injectable()
export class InventoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ inventories: Inventory[]; total: number }> {
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

  async findById(id: string): Promise<Inventory | null> {
    return this.prisma.inventory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByItemCode(itemCode: string): Promise<Inventory | null> {
    return this.prisma.inventory.findFirst({
      where: { itemCode, deletedAt: null },
    });
  }

  async create(data: any): Promise<Inventory> {
    return this.prisma.inventory.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<Inventory> {
    const inventory = await this.findById(id);
    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return this.prisma.inventory.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Inventory> {
    const inventory = await this.findById(id);
    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return this.prisma.inventory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findLowStock(): Promise<Inventory[]> {
    return this.prisma.inventory.findMany({
      where: {
        deletedAt: null,
        currentStock: { lte: this.prisma.inventory.fields.minStockLevel },
      },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.inventory.count({ where });
  }
}
