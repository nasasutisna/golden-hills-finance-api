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
exports.CommunityEventsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CommunityEventsRepository = class CommunityEventsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [events, total] = await Promise.all([
            this.prisma.communityEvent.findMany({
                where,
                skip,
                take,
                orderBy,
            }),
            this.prisma.communityEvent.count({ where }),
        ]);
        return { events, total };
    }
    async findById(id) {
        return this.prisma.communityEvent.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.communityEvent.create({
            data,
        });
    }
    async update(id, data) {
        const event = await this.findById(id);
        if (!event) {
            throw new common_1.NotFoundException(`Community event with ID ${id} not found`);
        }
        return this.prisma.communityEvent.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        const event = await this.findById(id);
        if (!event) {
            throw new common_1.NotFoundException(`Community event with ID ${id} not found`);
        }
        return this.prisma.communityEvent.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async findUpcoming() {
        return this.prisma.communityEvent.findMany({
            where: {
                deletedAt: null,
                startDate: { gte: new Date() },
                status: { in: ['PUBLISHED', 'ONGOING'] },
            },
            orderBy: { startDate: 'asc' },
        });
    }
    async count(where) {
        return this.prisma.communityEvent.count({ where });
    }
};
exports.CommunityEventsRepository = CommunityEventsRepository;
exports.CommunityEventsRepository = CommunityEventsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommunityEventsRepository);
//# sourceMappingURL=community-events.repository.js.map