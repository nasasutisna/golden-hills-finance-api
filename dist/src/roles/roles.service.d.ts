import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesRepository } from './roles.repository';
export declare class RolesService {
    private readonly rolesRepository;
    private readonly logger;
    constructor(rolesRepository: RolesRepository);
    findAll(queryOptions: QueryOptionsDto): Promise<{
        data: {
            id: string;
            name: string;
            description: string | null;
            permissions: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
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
        name: string;
        description: string | null;
        permissions: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    findByName(name: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        permissions: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    } | null>;
    create(createRoleDto: CreateRoleDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        permissions: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        permissions: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    softDelete(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        permissions: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    restore(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        permissions: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
