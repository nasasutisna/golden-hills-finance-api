"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateUser(username, password) {
        const user = await this.usersService.findByUsername(username);
        if (!user) {
            return null;
        }
        if (!user.password) {
            return null;
        }
        try {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return null;
            }
        }
        catch (error) {
            this.logger.warn(`Invalid password hash for user ${username}`);
            return null;
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const { password: _, ...result } = user;
        return result;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.generateTokens(user);
        await this.usersService.update(user.id, {
            refreshToken: tokens.refreshToken,
            refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            lastLoginAt: new Date(),
        });
        this.logger.log(`User logged in: ${user.username}`);
        return {
            ...tokens,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roleId: user.roleId,
            },
        };
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByUsername(registerDto.username);
        if (existingUser) {
            throw new common_1.ConflictException('Username already exists');
        }
        const existingEmail = await this.usersService.findByEmail(registerDto.email);
        if (existingEmail) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, parseInt(this.configService.get('BCRYPT_ROUNDS', '10')));
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
            isActive: true,
            isEmailVerified: false,
        });
        const tokens = await this.generateTokens(user);
        this.logger.log(`New user registered: ${user.username}`);
        return {
            ...tokens,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roleId: user.roleId,
            },
        };
    }
    async refreshTokens(refreshTokenDto) {
        try {
            const payload = this.jwtService.verify(refreshTokenDto.refreshToken);
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            if (user.refreshToken !== refreshTokenDto.refreshToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const expiryDate = user.refreshTokenExpiry
                ? new Date(user.refreshTokenExpiry)
                : null;
            if (expiryDate && expiryDate < new Date()) {
                throw new common_1.UnauthorizedException('Refresh token expired');
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('Account is deactivated');
            }
            const tokens = await this.generateTokens(user);
            await this.usersService.update(user.id, {
                refreshToken: tokens.refreshToken,
                refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
            return tokens;
        }
        catch (error) {
            this.logger.error('Refresh token error:', error);
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async logout(userId) {
        await this.usersService.update(userId, {
            refreshToken: null,
            refreshTokenExpiry: null,
        });
        this.logger.log(`User logged out: ${userId}`);
    }
    async verifyEmail(token) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.type !== 'email_verification') {
                throw new common_1.BadRequestException('Invalid token type');
            }
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            if (user.isEmailVerified) {
                throw new common_1.BadRequestException('Email already verified');
            }
            await this.usersService.update(user.id, {
                isEmailVerified: true,
            });
            this.logger.log(`Email verified: ${user.username}`);
        }
        catch (error) {
            this.logger.error('Email verification error:', error);
            throw new common_1.BadRequestException('Invalid or expired verification token');
        }
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            roleId: user.roleId,
            type: 'access',
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign({ ...payload, type: 'refresh' }, {
            secret: this.configService.get('jwt.refreshSecret') || 'default-refresh-secret',
            expiresIn: (this.configService.get('jwt.refreshExpiresIn') || '7d'),
        });
        const expiresIn = this.configService.get('jwt.expiresIn') || '1h';
        const expiresInSeconds = this.parseExpirationToSeconds(expiresIn);
        return {
            accessToken,
            refreshToken,
            expiresIn: expiresInSeconds,
            tokenType: 'Bearer',
        };
    }
    parseExpirationToSeconds(expiration) {
        const match = expiration.match(/^(\d+)([smhd])$/);
        if (!match)
            return 3600;
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
        };
        return value * (multipliers[unit] || 3600);
    }
    async validateToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map