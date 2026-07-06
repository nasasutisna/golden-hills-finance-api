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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const notifications_repository_1 = require("./notifications.repository");
let NotificationsService = class NotificationsService {
    constructor(repository) {
        this.repository = repository;
    }
    async create(createNotificationDto) {
        return this.repository.create(createNotificationDto);
    }
    async createBulk(notifications) {
        return Promise.all(notifications.map(dto => this.create(dto)));
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, userId, type, priority, isRead, actionType, search } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (userId) {
            where.userId = userId;
        }
        if (type) {
            where.type = type;
        }
        if (priority) {
            where.priority = priority;
        }
        if (isRead !== undefined) {
            where.isRead = isRead;
        }
        if (actionType) {
            where.actionType = actionType;
        }
        where.OR = [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
        ];
        if (search) {
            where.AND = [
                where.OR,
                {
                    OR: [
                        { title: { contains: search } },
                        { message: { contains: search } },
                    ],
                },
            ];
            delete where.OR;
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'desc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const notification = await this.repository.findById(id);
        if (!notification) {
            throw new common_1.NotFoundException(`Notification with ID ${id} not found`);
        }
        return notification;
    }
    async findByUser(userId) {
        return this.repository.findByUser(userId);
    }
    async findUnreadByUser(userId) {
        return this.repository.findUnreadByUser(userId);
    }
    async update(id, updateNotificationDto) {
        return this.repository.update(id, updateNotificationDto);
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.softDelete(id);
    }
    async markAsRead(id) {
        await this.findById(id);
        return this.repository.markAsRead(id);
    }
    async markAllAsReadForUser(userId) {
        return this.repository.markAllAsReadForUser(userId);
    }
    async countUnreadByUser(userId) {
        return this.repository.countUnreadByUser(userId);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_repository_1.NotificationsRepository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map