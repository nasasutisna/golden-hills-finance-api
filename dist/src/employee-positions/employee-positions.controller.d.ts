import { EmployeePositionsService } from './employee-positions.service';
import { CreateEmployeePositionDto } from './dto/create-employee-position.dto';
import { UpdateEmployeePositionDto } from './dto/update-employee-position.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
export declare class EmployeePositionsController {
    private readonly employeePositionsService;
    constructor(employeePositionsService: EmployeePositionsService);
    create(createEmployeePositionDto: CreateEmployeePositionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            department: string;
            positionCode: string;
            positionName: string;
            salaryGrade: string | null;
            level: number | null;
        };
    }>;
    findAll(queryOptions: QueryOptionsDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            department: string;
            positionCode: string;
            positionName: string;
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
    getActive(): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            department: string;
            positionCode: string;
            positionName: string;
            salaryGrade: string | null;
            level: number | null;
        }[];
    }>;
    getByDepartment(department: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            department: string;
            positionCode: string;
            positionName: string;
            salaryGrade: string | null;
            level: number | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            department: string;
            positionCode: string;
            positionName: string;
            salaryGrade: string | null;
            level: number | null;
        };
    }>;
    update(id: string, updateEmployeePositionDto: UpdateEmployeePositionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            department: string;
            positionCode: string;
            positionName: string;
            salaryGrade: string | null;
            level: number | null;
        };
    }>;
    remove(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            department: string;
            positionCode: string;
            positionName: string;
            salaryGrade: string | null;
            level: number | null;
        };
    }>;
    restore(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            department: string;
            positionCode: string;
            positionName: string;
            salaryGrade: string | null;
            level: number | null;
        };
    }>;
}
