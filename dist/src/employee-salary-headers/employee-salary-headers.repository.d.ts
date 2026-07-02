import { PrismaService } from '../prisma/prisma.service';
import { EmployeeSalaryHeader } from '@prisma/client';
export declare class EmployeeSalaryHeadersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        headers: EmployeeSalaryHeader[];
        total: number;
    }>;
    findById(id: string): Promise<any>;
    findByPayrollNumber(payrollNumber: string): Promise<EmployeeSalaryHeader | null>;
    findByEmployeeAndPeriod(employeeId: string, payPeriod: string): Promise<EmployeeSalaryHeader | null>;
    create(data: any): Promise<EmployeeSalaryHeader>;
    update(id: string, data: any): Promise<EmployeeSalaryHeader>;
    softDelete(id: string): Promise<EmployeeSalaryHeader>;
    count(where?: any): Promise<number>;
}
