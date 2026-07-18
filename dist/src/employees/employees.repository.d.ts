import { PrismaService } from '../prisma/prisma.service';
import { Employee } from '@prisma/client';
export declare class EmployeesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
        include?: any;
    }): Promise<{
        employees: Employee[];
        total: number;
    }>;
    findById(id: string, include?: any): Promise<Employee>;
    findByEmployeeCode(employeeCode: string): Promise<Employee | null>;
    generateEmployeeCode(): Promise<string>;
    create(data: any): Promise<Employee>;
    update(id: string, data: any): Promise<Employee>;
    softDelete(id: string): Promise<Employee>;
    restore(id: string): Promise<Employee>;
    updatePassword(id: string, newPassword: string): Promise<void>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getActiveEmployeesCount(): Promise<number>;
    getByPosition(positionId: string): Promise<Employee[]>;
    getByDepartment(department: string): Promise<Employee[]>;
    getByEmploymentStatus(status: string): Promise<Employee[]>;
    getEmployeeStatistics(): Promise<{
        totalEmployees: number;
        activeEmployees: number;
        probationEmployees: number;
        resignedEmployees: number;
        terminatedEmployees: number;
        byDepartment: Record<string, number>;
    }>;
    deactivate(id: string): Promise<Employee>;
    activate(id: string): Promise<Employee>;
}
