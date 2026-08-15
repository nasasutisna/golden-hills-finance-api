import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBlastService } from '../whatsapp-blast/whatsapp-blast.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export interface TokenPayload {
    sub: string;
    username: string;
    email: string;
    roleId: string;
    type: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}
export interface JwtPayload {
    sub: string;
    username: string;
    email: string;
    roleId: string;
    iat?: number;
    exp?: number;
    type?: string;
}
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly prisma;
    private readonly whatsappBlastService;
    private readonly logger;
    private static readonly OTP_TTL_MS;
    private static readonly MAX_VERIFY_ATTEMPTS;
    private static readonly THROTTLE_WINDOW_MS;
    private static readonly THROTTLE_MAX;
    private static readonly RESEND_COOLDOWN_MS;
    private readonly requestThrottle;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, prisma: PrismaService, whatsappBlastService: WhatsappBlastService);
    validateUser(username: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<AuthTokens & {
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<AuthTokens & {
        user: any;
    }>;
    getMe(userId: string): Promise<{
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
    }>;
    private buildUserResponse;
    refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    requestPasswordReset(unitNumber: string, phoneNumber: string): Promise<{
        resetToken: string;
        maskedPhone: string;
    }>;
    resetPassword(resetToken: string, otp: string, newPassword: string): Promise<{
        success: true;
    }>;
    requestRegistration(unitNumber: string, phoneNumber: string): Promise<{
        registerToken: string;
        maskedPhone: string;
    }>;
    completeRegistration(registerToken: string, otp: string, newPassword: string): Promise<AuthTokens & {
        user: any;
    }>;
    private ensureUniqueUsername;
    private resolveDefaultRoleId;
    private ensureUniqueEmail;
    private checkThrottle;
    private hashOtp;
    private maskPhone;
    generateTokens(user: any): Promise<AuthTokens>;
    private parseExpirationToSeconds;
    private getRefreshTokenExpiryDate;
    validateToken(token: string): Promise<JwtPayload>;
}
