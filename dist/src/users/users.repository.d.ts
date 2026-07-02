import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class UsersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapLegacyUser;
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
        include?: any;
    }): Promise<{
        users: User[];
        total: number;
    }>;
    findById(id: string, include?: any): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: any): Promise<User>;
    update(id: string, data: any): Promise<User>;
    softDelete(id: string): Promise<User>;
    restore(id: string): Promise<User>;
    updatePassword(id: string, newPassword: string): Promise<void>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
