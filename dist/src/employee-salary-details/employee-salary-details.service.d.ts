import { EmployeeSalaryDetailsRepository } from './employee-salary-details.repository';
import { CreateEmployeeSalaryDetailDto } from './dto/create-employee-salary-detail.dto';
import { UpdateEmployeeSalaryDetailDto } from './dto/update-employee-salary-detail.dto';
import { QueryEmployeeSalaryDetailsDto } from './dto/query-employee-salary-details.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class EmployeeSalaryDetailsService {
    private readonly repository;
    private readonly prisma;
    constructor(repository: EmployeeSalaryDetailsRepository, prisma: PrismaService);
    create(createEmployeeSalaryDetailDto: CreateEmployeeSalaryDetailDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        quantity: number;
        salaryHeaderId: string;
        componentId: string;
        manualOverride: boolean;
    }>;
    findAll(queryDto: QueryEmployeeSalaryDetailsDto): Promise<{
        details: import(".prisma/client").EmployeeSalaryDetail[];
        total: number;
    }>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        quantity: number;
        salaryHeaderId: string;
        componentId: string;
        manualOverride: boolean;
    }>;
    findBySalaryHeader(salaryHeaderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        quantity: number;
        salaryHeaderId: string;
        componentId: string;
        manualOverride: boolean;
    }[]>;
    update(id: string, updateEmployeeSalaryDetailDto: UpdateEmployeeSalaryDetailDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        quantity: number;
        salaryHeaderId: string;
        componentId: string;
        manualOverride: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        quantity: number;
        salaryHeaderId: string;
        componentId: string;
        manualOverride: boolean;
    }>;
}
