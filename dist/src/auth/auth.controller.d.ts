import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./auth.service").AuthTokens & {
            user: any;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./auth.service").AuthTokens & {
            user: any;
        };
    }>;
    refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./auth.service").AuthTokens;
    }>;
    logout(user: CurrentUserData): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getCurrentUser(user: CurrentUserData): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: CurrentUserData;
    }>;
    verifyEmail(token: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
