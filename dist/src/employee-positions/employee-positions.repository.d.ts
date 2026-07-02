import { PrismaService } from '../prisma/prisma.service';
import { EmployeePosition } from '@prisma/client';
export declare class EmployeePositionsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        positions: EmployeePosition[];
        total: number;
    }>;
    findById(id: string): Promise<EmployeePosition>;
    findByPositionCode(positionCode: string): Promise<EmployeePosition | null>;
    create(data: any): Promise<EmployeePosition>;
    update(id: string, data: any): Promise<EmployeePosition>;
    softDelete(id: string): Promise<EmployeePosition>;
    restore(id: string): Promise<EmployeePosition>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getActivePositions(): Promise<EmployeePosition[]>;
    getByDepartment(department: string): Promise<EmployeePosition[]>;
}
