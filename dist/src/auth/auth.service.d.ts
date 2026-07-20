import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
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
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    validateUser(username: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<AuthTokens & {
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<AuthTokens & {
        user: any;
    }>;
    refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    generateTokens(user: any): Promise<AuthTokens>;
    private parseExpirationToSeconds;
    private getRefreshTokenExpiryDate;
    validateToken(token: string): Promise<JwtPayload>;
}
