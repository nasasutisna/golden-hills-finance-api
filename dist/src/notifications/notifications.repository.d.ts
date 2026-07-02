import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
export declare class NotificationsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        notifications: Notification[];
        total: number;
    }>;
    findById(id: string): Promise<Notification | null>;
    findByUser(userId: string): Promise<Notification[]>;
    findUnreadByUser(userId: string): Promise<Notification[]>;
    create(data: any): Promise<Notification>;
    update(id: string, data: any): Promise<Notification>;
    softDelete(id: string): Promise<Notification>;
    markAsRead(id: string): Promise<Notification>;
    markAllAsReadForUser(userId: string): Promise<{
        count: number;
    }>;
    count(where?: any): Promise<number>;
    countUnreadByUser(userId: string): Promise<number>;
}
