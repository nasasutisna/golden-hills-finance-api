import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class UsersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findById(id: string, include?: any): Promise<any>;
    findByUsername(username: string, include?: any): Promise<any | null>;
    findByEmail(email: string, include?: any): Promise<any | null>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<any>;
    restore(id: string): Promise<any>;
    updatePassword(id: string, hashedPassword: string): Promise<void>;
    linkResident(residentId: string, userId: string): Promise<void>;
    unlinkResident(residentId: string): Promise<void>;
    unlinkResidentByUserId(userId: string): Promise<void>;
    findResidentById(residentId: string): Promise<any | null>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
