import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
    findAll(queryOptions: QueryOptionsDto): Promise<{
        statusCode: number;
        message: string;
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
    findOne(id: string): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
    remove(id: string): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
    restore(id: string): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
    deactivate(id: string): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
    activate(id: string): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
}
