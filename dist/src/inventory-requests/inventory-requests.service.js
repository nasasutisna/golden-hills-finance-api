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
exports.InventoryRequestsService = void 0;
const common_1 = require("@nestjs/common");
const inventory_requests_repository_1 = require("./inventory-requests.repository");
const prisma_service_1 = require("../prisma/prisma.service");
const create_inventory_request_dto_1 = require("./dto/create-inventory-request.dto");
let InventoryRequestsService = class InventoryRequestsService {
    constructor(repository, prisma) {
        this.repository = repository;
        this.prisma = prisma;
    }
    async create(createInventoryRequestDto, userId) {
        const existing = await this.repository.findByRequestNumber(createInventoryRequestDto.requestNumber);
        if (existing) {
            throw new common_1.ConflictException(`Request with number ${createInventoryRequestDto.requestNumber} already exists`);
        }
        const inventory = await this.prisma.inventory.findFirst({
            where: { id: createInventoryRequestDto.inventoryId, deletedAt: null },
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory item with ID ${createInventoryRequestDto.inventoryId} not found`);
        }
        return this.repository.create({
            ...createInventoryRequestDto,
            requestedBy: userId,
        });
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, status, priority, department, inventoryId, dateFrom, dateTo, search } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
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
                { requestNumber: { contains: search } },
                { purpose: { contains: search } },
            ];
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { requestDate: 'desc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const request = await this.repository.findById(id);
        if (!request) {
            throw new common_1.NotFoundException(`Inventory request with ID ${id} not found`);
        }
        return request;
    }
    async update(id, updateInventoryRequestDto) {
        if (updateInventoryRequestDto.requestNumber) {
            const existing = await this.repository.findByRequestNumber(updateInventoryRequestDto.requestNumber);
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Request with number ${updateInventoryRequestDto.requestNumber} already exists`);
            }
        }
        return this.repository.update(id, updateInventoryRequestDto);
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.softDelete(id);
    }
    async approveRequest(id, approverId, notes) {
        const request = await this.findById(id);
        if (request.status !== create_inventory_request_dto_1.RequestStatus.PENDING) {
            throw new common_1.ConflictException(`Cannot approve request with status ${request.status}`);
        }
        return this.repository.update(id, {
            status: create_inventory_request_dto_1.RequestStatus.APPROVED,
            approvedBy: approverId,
            approvedAt: new Date(),
            approvalNotes: notes,
        });
    }
    async rejectRequest(id, approverId, notes) {
        const request = await this.findById(id);
        if (request.status !== create_inventory_request_dto_1.RequestStatus.PENDING) {
            throw new common_1.ConflictException(`Cannot reject request with status ${request.status}`);
        }
        return this.repository.update(id, {
            status: create_inventory_request_dto_1.RequestStatus.REJECTED,
            approvedBy: approverId,
            approvedAt: new Date(),
            approvalNotes: notes,
        });
    }
    async completeRequest(id) {
        const request = await this.findById(id);
        if (request.status !== create_inventory_request_dto_1.RequestStatus.APPROVED) {
            throw new common_1.ConflictException(`Cannot complete request with status ${request.status}`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.inventoryRequest.update({
                where: { id },
                data: {
                    status: create_inventory_request_dto_1.RequestStatus.COMPLETED,
                    completedAt: new Date(),
                },
            });
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
    async findByStatus(status) {
        return this.repository.findByStatus(status);
    }
};
exports.InventoryRequestsService = InventoryRequestsService;
exports.InventoryRequestsService = InventoryRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_requests_repository_1.InventoryRequestsRepository,
        prisma_service_1.PrismaService])
], InventoryRequestsService);
//# sourceMappingURL=inventory-requests.service.js.map