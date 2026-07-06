import { EmployeeSalaryDetailsService } from './employee-salary-details.service';
import { CreateEmployeeSalaryDetailDto } from './dto/create-employee-salary-detail.dto';
import { UpdateEmployeeSalaryDetailDto } from './dto/update-employee-salary-detail.dto';
import { QueryEmployeeSalaryDetailsDto } from './dto/query-employee-salary-details.dto';
export declare class EmployeeSalaryDetailsController {
    private readonly employeeSalaryDetailsService;
    constructor(employeeSalaryDetailsService: EmployeeSalaryDetailsService);
    create(createEmployeeSalaryDetailDto: CreateEmployeeSalaryDetailDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        notes: string | null;
        salaryHeaderId: string;
        componentId: string;
        quantity: number;
        manualOverride: boolean;
    }>;
    findAll(queryDto: QueryEmployeeSalaryDetailsDto): Promise<{
        details: import(".prisma/client").EmployeeSalaryDetail[];
        total: number;
    }>;
    findBySalaryHeader(salaryHeaderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        notes: string | null;
        salaryHeaderId: string;
        componentId: string;
        quantity: number;
        manualOverride: boolean;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        notes: string | null;
        salaryHeaderId: string;
        componentId: string;
        quantity: number;
        manualOverride: boolean;
    }>;
    update(id: string, updateEmployeeSalaryDetailDto: UpdateEmployeeSalaryDetailDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        notes: string | null;
        salaryHeaderId: string;
        componentId: string;
        quantity: number;
        manualOverride: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        notes: string | null;
        salaryHeaderId: string;
        componentId: string;
        quantity: number;
        manualOverride: boolean;
    }>;
}
