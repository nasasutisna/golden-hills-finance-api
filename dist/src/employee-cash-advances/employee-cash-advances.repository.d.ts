import { PrismaService } from '../prisma/prisma.service';
import { EmployeeCashAdvance } from '@prisma/client';
export declare class EmployeeCashAdvancesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        advances: EmployeeCashAdvance[];
        total: number;
    }>;
    findById(id: string): Promise<any>;
    findByAdvanceNumber(advanceNumber: string): Promise<EmployeeCashAdvance | null>;
    findByEmployee(employeeId: string): Promise<EmployeeCashAdvance[]>;
    findPendingApproval(): Promise<EmployeeCashAdvance[]>;
    create(data: any): Promise<EmployeeCashAdvance>;
    update(id: string, data: any): Promise<EmployeeCashAdvance>;
    softDelete(id: string): Promise<EmployeeCashAdvance>;
    count(where?: any): Promise<number>;
}
