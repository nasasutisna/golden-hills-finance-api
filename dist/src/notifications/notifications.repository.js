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
exports.NotificationsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsRepository = class NotificationsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            this.prisma.notification.count({ where }),
        ]);
        return { notifications, total };
    }
    async findById(id) {
        return this.prisma.notification.findFirst({
            where: { id, deletedAt: null },
            include: {
                user: true,
            },
        });
    }
    async findByUser(userId) {
        return this.prisma.notification.findMany({
            where: {
                userId,
                deletedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findUnreadByUser(userId) {
        return this.prisma.notification.findMany({
            where: {
                userId,
                isRead: false,
                deletedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.notification.create({
            data,
            include: {
                user: true,
            },
        });
    }
    async update(id, data) {
        const notification = await this.findById(id);
        if (!notification) {
            throw new common_1.NotFoundException(`Notification with ID ${id} not found`);
        }
        return this.prisma.notification.update({
            where: { id },
            data,
            include: {
                user: true,
            },
        });
    }
    async softDelete(id) {
        const notification = await this.findById(id);
        if (!notification) {
            throw new common_1.NotFoundException(`Notification with ID ${id} not found`);
        }
        return this.prisma.notification.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async markAsRead(id) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllAsReadForUser(userId) {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
                deletedAt: null,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return { count: result.count };
    }
    async count(where) {
        return this.prisma.notification.count({ where });
    }
    async countUnreadByUser(userId) {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
                deletedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } },
                ],
            },
        });
    }
};
exports.NotificationsRepository = NotificationsRepository;
exports.NotificationsRepository = NotificationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsRepository);
//# sourceMappingURL=notifications.repository.js.map