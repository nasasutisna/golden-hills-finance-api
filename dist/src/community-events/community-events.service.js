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
exports.CommunityEventsService = void 0;
const common_1 = require("@nestjs/common");
const community_events_repository_1 = require("./community-events.repository");
let CommunityEventsService = class CommunityEventsService {
    constructor(repository) {
        this.repository = repository;
    }
    async create(createCommunityEventDto, userId) {
        return this.repository.create({
            ...createCommunityEventDto,
            createdBy: userId,
        });
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, status, eventType, location, dateFrom, dateTo, search } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (status) {
            where.status = status;
        }
        if (eventType) {
            where.eventType = eventType;
        }
        if (location) {
            where.location = { contains: location };
        }
        if (dateFrom || dateTo) {
            where.eventStartDate = {};
            if (dateFrom) {
                where.eventStartDate.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.eventStartDate.lte = new Date(dateTo);
            }
        }
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ];
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { eventStartDate: 'desc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const event = await this.repository.findById(id);
        if (!event) {
            throw new common_1.NotFoundException(`Community event with ID ${id} not found`);
        }
        return event;
    }
    async update(id, updateCommunityEventDto) {
        return this.repository.update(id, updateCommunityEventDto);
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.softDelete(id);
    }
    async getUpcomingEvents() {
        return this.repository.findUpcoming();
    }
};
exports.CommunityEventsService = CommunityEventsService;
exports.CommunityEventsService = CommunityEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [community_events_repository_1.CommunityEventsRepository])
], CommunityEventsService);
//# sourceMappingURL=community-events.service.js.map