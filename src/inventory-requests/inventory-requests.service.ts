import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InventoryRequestsRepository } from './inventory-requests.repository';
import { CreateInventoryRequestDto } from './dto/create-inventory-request.dto';
import { UpdateInventoryRequestDto } from './dto/update-inventory-request.dto';
import { QueryInventoryRequestsDto } from './dto/query-inventory-requests.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from './dto/create-inventory-request.dto';

@Injectable()
export class InventoryRequestsService {
  constructor(
    private readonly repository: InventoryRequestsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createInventoryRequestDto: CreateInventoryRequestDto, userId: string) {
    // Check if request number already exists
    const existing = await this.repository.findByRequestNumber(createInventoryRequestDto.requestNumber);
    if (existing) {
      throw new ConflictException(`Request with number ${createInventoryRequestDto.requestNumber} already exists`);
    }

    // Check if inventory item exists
    const inventory = await this.prisma.inventory.findFirst({
      where: { id: createInventoryRequestDto.inventoryId, deletedAt: null },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${createInventoryRequestDto.inventoryId} not found`);
    }

    // Create request with requester information
    return this.repository.create({
      ...createInventoryRequestDto,
      requestedBy: userId,
    });
  }

  async findAll(queryDto: QueryInventoryRequestsDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, status, priority, department, inventoryId, dateFrom, dateTo, search } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (department) {
      where.department = department;
    }

    if (inventoryId) {
      where.inventoryId = inventoryId;
    }

    if (dateFrom || dateTo) {
      where.requestDate = {};
      if (dateFrom) {
        where.requestDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.requestDate.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { requestDate: 'desc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const request = await this.repository.findById(id);
    if (!request) {
      throw new NotFoundException(`Inventory request with ID ${id} not found`);
    }
    return request;
  }

  async update(id: string, updateInventoryRequestDto: UpdateInventoryRequestDto) {
    // If updating request number, check if it already exists
    if (updateInventoryRequestDto.requestNumber) {
      const existing = await this.repository.findByRequestNumber(updateInventoryRequestDto.requestNumber);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Request with number ${updateInventoryRequestDto.requestNumber} already exists`);
      }
    }

    return this.repository.update(id, updateInventoryRequestDto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async approveRequest(id: string, approverId: string, notes?: string) {
    const request = await this.findById(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException(`Cannot approve request with status ${request.status}`);
    }

    return this.repository.update(id, {
      status: RequestStatus.APPROVED,
      approvedBy: approverId,
      approvedAt: new Date(),
      approvalNotes: notes,
    });
  }

  async rejectRequest(id: string, approverId: string, notes?: string) {
    const request = await this.findById(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException(`Cannot reject request with status ${request.status}`);
    }

    return this.repository.update(id, {
      status: RequestStatus.REJECTED,
      approvedBy: approverId,
      approvedAt: new Date(),
      approvalNotes: notes,
    });
  }

  async completeRequest(id: string) {
    const request = await this.findById(id);

    if (request.status !== RequestStatus.APPROVED) {
      throw new ConflictException(`Cannot complete request with status ${request.status}`);
    }

    // Use transaction to update request and inventory stock
    await this.prisma.$transaction(async (tx) => {
      // Update request status
      await tx.inventoryRequest.update({
        where: { id },
        data: {
          status: RequestStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Update inventory stock
      await tx.inventory.update({
        where: { id: request.inventoryId },
        data: {
          currentStock: {
            decrement: request.requestedQuantity,
          },
        },
      });
    });

    return this.findById(id);
  }

  async findByStatus(status: string) {
    return this.repository.findByStatus(status);
  }
}
