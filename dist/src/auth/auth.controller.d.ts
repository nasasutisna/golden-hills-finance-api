import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordRequestDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { RegisterRequestDto, RegisterCompleteDto } from './dto/register-otp.dto';
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
        data: {
            id: any;
            username: any;
            email: any;
            firstName: any;
            lastName: any;
            roleId: any;
            role: {
                id: any;
                name: any;
                description: any;
            } | null;
        };
    }>;
    changePassword(user: CurrentUserData, dto: ChangePasswordDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    requestPasswordReset(dto: ForgotPasswordRequestDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            resetToken: string;
            maskedPhone: string;
        };
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    requestRegistration(dto: RegisterRequestDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            registerToken: string;
            maskedPhone: string;
        };
    }>;
    completeRegistration(dto: RegisterCompleteDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./auth.service").AuthTokens & {
            user: any;
        };
    }>;
}
