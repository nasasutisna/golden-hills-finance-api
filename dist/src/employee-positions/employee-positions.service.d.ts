import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateEmployeePositionDto } from './dto/create-employee-position.dto';
import { UpdateEmployeePositionDto } from './dto/update-employee-position.dto';
import { EmployeePositionsRepository } from './employee-positions.repository';
export declare class EmployeePositionsService {
    private readonly employeePositionsRepository;
    private readonly logger;
    constructor(employeePositionsRepository: EmployeePositionsRepository);
    findAll(queryOptions: QueryOptionsDto): Promise<{
        data: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            positionCode: string;
            positionName: string;
            department: string;
            salaryGrade: string | null;
            level: number | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        positionCode: string;
        positionName: string;
        department: string;
        salaryGrade: string | null;
        level: number | null;
    }>;
    create(createEmployeePositionDto: CreateEmployeePositionDto): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        positionCode: string;
        positionName: string;
        department: string;
        salaryGrade: string | null;
        level: number | null;
    }>;
    update(id: string, updateEmployeePositionDto: UpdateEmployeePositionDto): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        positionCode: string;
        positionName: string;
        department: string;
        salaryGrade: string | null;
        level: number | null;
    }>;
    softDelete(id: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        positionCode: string;
        positionName: string;
        department: string;
        salaryGrade: string | null;
        level: number | null;
    }>;
    restore(id: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        positionCode: string;
        positionName: string;
        department: string;
        salaryGrade: string | null;
        level: number | null;
    }>;
    getActivePositions(): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        positionCode: string;
        positionName: string;
        department: string;
        salaryGrade: string | null;
        level: number | null;
    }[]>;
    getByDepartment(department: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        positionCode: string;
        positionName: string;
        department: string;
        salaryGrade: string | null;
        level: number | null;
    }[]>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
