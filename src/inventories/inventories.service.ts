import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InventoriesRepository } from './inventories.repository';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoriesDto } from './dto/query-inventories.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoriesService {
  constructor(
    private readonly repository: InventoriesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createInventoryDto: CreateInventoryDto) {
    // Check if item code already exists
    const existing = await this.repository.findByItemCode(createInventoryDto.itemCode);
    if (existing) {
      throw new ConflictException(`Item with code ${createInventoryDto.itemCode} already exists`);
    }

    return this.repository.create(createInventoryDto);
  }

  async findAll(queryDto: QueryInventoriesDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, itemType, unit, location, search, lowStock } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (itemType) {
      where.itemType = itemType;
    }

    if (unit) {
      where.unit = unit;
    }

    if (location) {
      where.location = location;
    }

    if (lowStock) {
      where.currentStock = { lte: this.prisma.inventory.fields.minStockLevel };
    }

    if (search) {
      where.OR = [
        { itemCode: { contains: search, mode: 'insensitive' } },
        { itemName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { itemName: 'asc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const inventory = await this.repository.findById(id);
    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }
    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    // If updating item code, check if new code already exists
    if (updateInventoryDto.itemCode) {
      const existing = await this.repository.findByItemCode(updateInventoryDto.itemCode);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Item with code ${updateInventoryDto.itemCode} already exists`);
      }
    }

    return this.repository.update(id, updateInventoryDto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async getLowStockItems() {
    return this.repository.findLowStock();
  }
}
