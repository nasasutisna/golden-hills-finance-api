import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.repository.create(createNotificationDto);
  }

  async createBulk(notifications: CreateNotificationDto[]) {
    return Promise.all(notifications.map(dto => this.create(dto)));
  }

  async findAll(queryDto: QueryNotificationsDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, userId, type, priority, isRead, actionType, search } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

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

    // Filter out expired notifications
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } },
    ];

    if (search) {
      where.AND = [
        where.OR,
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
      delete where.OR;
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'desc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const notification = await this.repository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async findByUser(userId: string) {
    return this.repository.findByUser(userId);
  }

  async findUnreadByUser(userId: string) {
    return this.repository.findUnreadByUser(userId);
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    return this.repository.update(id, updateNotificationDto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async markAsRead(id: string) {
    await this.findById(id);
    return this.repository.markAsRead(id);
  }

  async markAllAsReadForUser(userId: string) {
    return this.repository.markAllAsReadForUser(userId);
  }

  async countUnreadByUser(userId: string) {
    return this.repository.countUnreadByUser(userId);
  }
}
