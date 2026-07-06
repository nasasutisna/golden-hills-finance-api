import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
export declare class UsersService {
    private readonly usersRepository;
    private readonly logger;
    constructor(usersRepository: UsersRepository);
    findAll(queryOptions: QueryOptionsDto): Promise<{
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string, include?: any): Promise<any>;
    findByUsername(username: string, include?: any): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        username: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phoneNumber: string | null;
        avatar: string | null;
        isEmailVerified: boolean;
        lastLoginAt: Date | null;
        refreshToken: string | null;
        refreshTokenExpiry: Date | null;
        roleId: string;
    } | null>;
    findByEmail(email: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        username: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phoneNumber: string | null;
        avatar: string | null;
        isEmailVerified: boolean;
        lastLoginAt: Date | null;
        refreshToken: string | null;
        refreshTokenExpiry: Date | null;
        roleId: string;
    } | null>;
    create(createUserDto: CreateUserDto): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
    softDelete(id: string): Promise<any>;
    restore(id: string): Promise<any>;
    deactivate(id: string): Promise<any>;
    activate(id: string): Promise<any>;
    updatePassword(id: string, newPassword: string): Promise<void>;
    private excludeSensitiveData;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
