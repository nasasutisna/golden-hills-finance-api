import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export declare class RolesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        roles: Role[];
        total: number;
    }>;
    findById(id: string): Promise<Role | null>;
    findByName(name: string): Promise<Role | null>;
    create(data: any): Promise<Role>;
    update(id: string, data: any): Promise<Role>;
    softDelete(id: string): Promise<Role>;
    restore(id: string): Promise<Role>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
