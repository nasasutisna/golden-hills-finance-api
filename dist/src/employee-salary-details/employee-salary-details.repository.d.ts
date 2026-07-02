import { PrismaService } from '../prisma/prisma.service';
import { EmployeeSalaryDetail } from '@prisma/client';
export declare class EmployeeSalaryDetailsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        details: EmployeeSalaryDetail[];
        total: number;
    }>;
    findById(id: string): Promise<EmployeeSalaryDetail | null>;
    findBySalaryHeader(salaryHeaderId: string): Promise<EmployeeSalaryDetail[]>;
    create(data: any): Promise<EmployeeSalaryDetail>;
    update(id: string, data: any): Promise<EmployeeSalaryDetail>;
    softDelete(id: string): Promise<EmployeeSalaryDetail>;
    count(where?: any): Promise<number>;
}
