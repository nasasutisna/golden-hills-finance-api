import { ConfigService } from '@nestjs/config';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersRepository } from './users.repository';
import { WhatsappBlastService } from '../whatsapp-blast/whatsapp-blast.service';
export declare class UsersService {
    private readonly usersRepository;
    private readonly configService;
    private readonly whatsappBlastService;
    private readonly logger;
    constructor(usersRepository: UsersRepository, configService: ConfigService, whatsappBlastService: WhatsappBlastService);
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
    findByUsername(username: string, include?: any): Promise<any>;
    findByEmail(email: string): Promise<any>;
    create(createUserDto: CreateUserDto): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
    delete(id: string): Promise<any>;
    restore(id: string): Promise<any>;
    deactivate(id: string): Promise<any>;
    activate(id: string): Promise<any>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<{
        generatedPassword: string | undefined;
        whatsappSent: boolean;
        whatsappError: string | undefined;
    }>;
    updatePassword(id: string, newPassword: string): Promise<void>;
    verifyPassword(userId: string, plainPassword: string): Promise<boolean>;
    private hashPassword;
    private resolvePlainPassword;
    private generateStrongPassword;
    private sendCredentialsViaWhatsapp;
    private excludeSensitiveData;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
}
