import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryRequest } from '@prisma/client';

@Injectable()
export class InventoryRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ requests: InventoryRequest[]; total: number }> {
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

  async findById(id: string): Promise<InventoryRequest | null> {
    return this.prisma.inventoryRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        inventory: true,
      },
    });
  }

  async findByRequestNumber(requestNumber: string): Promise<InventoryRequest | null> {
    return this.prisma.inventoryRequest.findFirst({
      where: { requestNumber, deletedAt: null },
    });
  }

  async create(data: any): Promise<InventoryRequest> {
    return this.prisma.inventoryRequest.create({
      data,
      include: {
        inventory: true,
      },
    });
  }

  async update(id: string, data: any): Promise<InventoryRequest> {
    const request = await this.findById(id);
    if (!request) {
      throw new NotFoundException(`Inventory request with ID ${id} not found`);
    }

    return this.prisma.inventoryRequest.update({
      where: { id },
      data,
      include: {
        inventory: true,
      },
    });
  }

  async softDelete(id: string): Promise<InventoryRequest> {
    const request = await this.findById(id);
    if (!request) {
      throw new NotFoundException(`Inventory request with ID ${id} not found`);
    }

    return this.prisma.inventoryRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByStatus(status: string): Promise<InventoryRequest[]> {
    return this.prisma.inventoryRequest.findMany({
      where: { status, deletedAt: null },
      include: {
        inventory: true,
      },
      orderBy: { requestDate: 'desc' },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.inventoryRequest.count({ where });
  }
}
