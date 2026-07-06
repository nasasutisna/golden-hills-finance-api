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
            name: string;
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
            permissions: string | null;
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
        name: string;
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isActive: boolean;
        permissions: string | null;
    }>;
    findByName(name: string): Promise<{
        name: string;
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isActive: boolean;
        permissions: string | null;
    } | null>;
    create(createRoleDto: CreateRoleDto): Promise<{
        name: string;
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isActive: boolean;
        permissions: string | null;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        name: string;
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isActive: boolean;
        permissions: string | null;
    }>;
    softDelete(id: string): Promise<{
        name: string;
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isActive: boolean;
        permissions: string | null;
    }>;
    restore(id: string): Promise<{
        name: string;
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isActive: boolean;
        permissions: string | null;
    }>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
