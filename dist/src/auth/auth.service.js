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
const crypto = require("crypto");
const users_service_1 = require("../users/users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_blast_service_1 = require("../whatsapp-blast/whatsapp-blast.service");
const phone_helper_1 = require("../whatsapp-blast/helpers/phone.helper");
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, jwtService, configService, prisma, whatsappBlastService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
        this.whatsappBlastService = whatsappBlastService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.requestThrottle = new Map();
    }
    async validateUser(username, password) {
        const user = await this.usersService.findByUsername(username, {
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        });
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
            refreshTokenExpiry: this.getRefreshTokenExpiryDate(),
            lastLoginAt: new Date(),
        });
        this.logger.log(`User logged in: ${user.username}`);
        return {
            ...tokens,
            user: this.buildUserResponse(user),
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
        const user = await this.usersService.create({
            ...registerDto,
            roleId: registerDto.roleId || (await this.resolveDefaultRoleId()),
            isActive: true,
            isEmailVerified: false,
        });
        const userWithRole = await this.usersService.findById(user.id, {
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        });
        const tokens = await this.generateTokens(userWithRole);
        this.logger.log(`New user registered: ${user.username}`);
        return {
            ...tokens,
            user: this.buildUserResponse(userWithRole),
        };
    }
    async getMe(userId) {
        const user = await this.usersService.findById(userId, {
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.buildUserResponse(user);
    }
    buildUserResponse(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: user.roleId,
            role: user.role
                ? {
                    id: user.role.id,
                    name: user.role.name,
                    description: user.role.description,
                }
                : null,
        };
    }
    async refreshTokens(refreshTokenDto) {
        try {
            const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
                secret: this.configService.get('jwt.refreshSecret') ||
                    'default-refresh-secret',
            });
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
                refreshTokenExpiry: this.getRefreshTokenExpiryDate(),
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
    async changePassword(userId, currentPassword, newPassword) {
        const isCurrentValid = await this.usersService.verifyPassword(userId, currentPassword);
        if (!isCurrentValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        if (currentPassword === newPassword) {
            throw new common_1.BadRequestException('New password must be different from the current password');
        }
        await this.usersService.updatePassword(userId, newPassword);
        this.logger.log(`Password changed by user: ${userId}`);
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
    async requestPasswordReset(unitNumber, phoneNumber) {
        const unit = (unitNumber || '').trim();
        const phoneInput = (phoneNumber || '').trim();
        const dummy = () => ({ resetToken: crypto.randomUUID(), maskedPhone: '••••' });
        this.checkThrottle(`${unit.toLowerCase()}|${phoneInput}`);
        const input = (0, phone_helper_1.normalizeToWaJid)(phoneInput);
        if (!input.valid) {
            this.logger.debug(`Forgot-password: nomor tidak valid "${phoneInput}"`);
            return dummy();
        }
        const residents = await this.prisma.resident.findMany({
            where: {
                deletedAt: null,
                isActive: true,
                userId: { not: null },
                OR: [
                    { unitNumber: unit },
                    { houseUnit: { unitNumber: unit } },
                    { houseUnit: { unitCode: unit } },
                ],
            },
            select: { userId: true, phoneNumber: true },
        });
        const match = residents.find((r) => !!r.phoneNumber &&
            (0, phone_helper_1.normalizeToWaJid)(r.phoneNumber).normalized === input.normalized);
        if (!match?.userId) {
            this.logger.debug(`Forgot-password: tidak ada match unit "${unit}" + nomor terdaftar`);
            return dummy();
        }
        const userId = match.userId;
        const recent = await this.prisma.passwordResetOtp.findFirst({
            where: {
                userId,
                consumed: false,
                createdAt: { gt: new Date(Date.now() - AuthService_1.RESEND_COOLDOWN_MS) },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (recent) {
            return {
                resetToken: recent.id,
                maskedPhone: this.maskPhone(input.normalized),
            };
        }
        await this.prisma.passwordResetOtp.updateMany({
            where: { userId, consumed: false },
            data: { consumed: true },
        });
        const code = String(crypto.randomInt(100000, 1000000));
        const row = await this.prisma.passwordResetOtp.create({
            data: {
                userId,
                otpHash: this.hashOtp(userId, code),
                expiresAt: new Date(Date.now() + AuthService_1.OTP_TTL_MS),
            },
        });
        const message = `Kode reset password Golden Hills Anda: ${code}.\n` +
            `Berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.`;
        try {
            await this.whatsappBlastService.sendTest({
                phoneNumber: match.phoneNumber,
                message,
            });
        }
        catch (error) {
            this.logger.warn(`Forgot-password: gagal kirim OTP WA user ${userId}: ${error?.message}`);
            await this.prisma.passwordResetOtp.update({
                where: { id: row.id },
                data: { consumed: true },
            });
            throw new common_1.BadRequestException('Layanan WhatsApp belum siap. Mohon coba lagi beberapa saat lagi.');
        }
        this.logger.log(`Forgot-password: OTP dikirim untuk user ${userId}`);
        return {
            resetToken: row.id,
            maskedPhone: this.maskPhone(input.normalized),
        };
    }
    async resetPassword(resetToken, otp, newPassword) {
        const row = await this.prisma.passwordResetOtp.findUnique({
            where: { id: resetToken },
        });
        const now = new Date();
        if (!row || row.consumed || row.expiresAt < now) {
            throw new common_1.BadRequestException('Kode tidak valid atau sudah kadaluarsa. Silakan minta kode baru.');
        }
        const attempts = row.attempts + 1;
        if (attempts > AuthService_1.MAX_VERIFY_ATTEMPTS) {
            await this.prisma.passwordResetOtp.update({
                where: { id: resetToken },
                data: { consumed: true, attempts },
            });
            throw new common_1.BadRequestException('Terlalu banyak percobaan salah. Silakan minta kode baru.');
        }
        await this.prisma.passwordResetOtp.update({
            where: { id: resetToken },
            data: { attempts },
        });
        if (this.hashOtp(row.userId, otp) !== row.otpHash) {
            throw new common_1.BadRequestException('Kode OTP salah.');
        }
        await this.prisma.passwordResetOtp.update({
            where: { id: resetToken },
            data: { consumed: true },
        });
        await this.prisma.passwordResetOtp.updateMany({
            where: { userId: row.userId, consumed: false },
            data: { consumed: true },
        });
        await this.usersService.updatePassword(row.userId, newPassword);
        this.logger.warn(`Password direset via OTP untuk user ${row.userId}`);
        return { success: true };
    }
    async requestRegistration(unitNumber, phoneNumber) {
        const unit = (unitNumber || '').trim();
        const phoneInput = (phoneNumber || '').trim();
        this.checkThrottle(`register:${unit.toLowerCase()}|${phoneInput}`);
        const input = (0, phone_helper_1.normalizeToWaJid)(phoneInput);
        if (!input.valid) {
            throw new common_1.BadRequestException('Nomor WhatsApp tidak valid.');
        }
        const residents = await this.prisma.resident.findMany({
            where: {
                deletedAt: null,
                isActive: true,
                OR: [
                    { unitNumber: unit },
                    { houseUnit: { unitNumber: unit } },
                    { houseUnit: { unitCode: unit } },
                ],
            },
            select: { id: true, userId: true, phoneNumber: true },
        });
        if (residents.length === 0) {
            throw new common_1.BadRequestException('Nomor unit tidak ditemukan. Periksa kembali penulisan unit Anda.');
        }
        const match = residents.find((r) => !!r.phoneNumber &&
            (0, phone_helper_1.normalizeToWaJid)(r.phoneNumber).normalized === input.normalized);
        if (!match) {
            throw new common_1.BadRequestException('Nomor WhatsApp tidak cocok dengan unit ini.');
        }
        if (match.userId) {
            throw new common_1.ConflictException('Akun untuk unit ini sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.');
        }
        const residentId = match.id;
        const recent = await this.prisma.registerOtp.findFirst({
            where: {
                residentId,
                consumed: false,
                createdAt: { gt: new Date(Date.now() - AuthService_1.RESEND_COOLDOWN_MS) },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (recent) {
            return {
                registerToken: recent.id,
                maskedPhone: this.maskPhone(input.normalized),
            };
        }
        await this.prisma.registerOtp.updateMany({
            where: { residentId, consumed: false },
            data: { consumed: true },
        });
        const code = String(crypto.randomInt(100000, 1000000));
        const row = await this.prisma.registerOtp.create({
            data: {
                residentId,
                otpHash: this.hashOtp(residentId, code),
                expiresAt: new Date(Date.now() + AuthService_1.OTP_TTL_MS),
            },
        });
        const message = `Kode registrasi Golden Hills Anda: ${code}.\n` +
            `Berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.`;
        try {
            await this.whatsappBlastService.sendTest({
                phoneNumber: match.phoneNumber,
                message,
            });
        }
        catch (error) {
            this.logger.warn(`Register: gagal kirim OTP WA resident ${residentId}: ${error?.message}`);
            await this.prisma.registerOtp.update({
                where: { id: row.id },
                data: { consumed: true },
            });
            throw new common_1.BadRequestException('Layanan WhatsApp belum siap. Mohon coba lagi beberapa saat lagi.');
        }
        this.logger.log(`Register: OTP dikirim untuk resident ${residentId}`);
        return {
            registerToken: row.id,
            maskedPhone: this.maskPhone(input.normalized),
        };
    }
    async completeRegistration(registerToken, otp, newPassword) {
        const row = await this.prisma.registerOtp.findUnique({
            where: { id: registerToken },
        });
        const now = new Date();
        if (!row || row.consumed || row.expiresAt < now) {
            throw new common_1.BadRequestException('Kode tidak valid atau sudah kadaluarsa. Silakan minta kode baru.');
        }
        const attempts = row.attempts + 1;
        if (attempts > AuthService_1.MAX_VERIFY_ATTEMPTS) {
            await this.prisma.registerOtp.update({
                where: { id: registerToken },
                data: { consumed: true, attempts },
            });
            throw new common_1.BadRequestException('Terlalu banyak percobaan salah. Silakan minta kode baru.');
        }
        await this.prisma.registerOtp.update({
            where: { id: registerToken },
            data: { attempts },
        });
        if (this.hashOtp(row.residentId, otp) !== row.otpHash) {
            throw new common_1.BadRequestException('Kode OTP salah.');
        }
        const resident = await this.prisma.resident.findUnique({
            where: { id: row.residentId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                houseUnit: { select: { unitCode: true } },
            },
        });
        if (!resident) {
            throw new common_1.BadRequestException('Data warga tidak ditemukan.');
        }
        const baseUnit = resident.houseUnit?.unitCode || `resident-${resident.id.slice(0, 8)}`;
        const username = await this.ensureUniqueUsername(baseUnit);
        const email = await this.ensureUniqueEmail(resident.email ||
            `${baseUnit.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@resident.local`);
        const createUserDto = {
            username,
            email,
            password: newPassword,
            passwordMode: 'manual',
            firstName: resident.firstName,
            lastName: resident.lastName,
            phoneNumber: resident.phoneNumber ?? undefined,
            roleId: await this.resolveDefaultRoleId(),
            isActive: true,
            isEmailVerified: false,
            residentId: resident.id,
        };
        const user = await this.usersService.create(createUserDto);
        await this.prisma.registerOtp.update({
            where: { id: registerToken },
            data: { consumed: true },
        });
        await this.prisma.registerOtp.updateMany({
            where: { residentId: resident.id, consumed: false },
            data: { consumed: true },
        });
        const userWithRole = await this.usersService.findById(user.id, {
            role: {
                select: { id: true, name: true, description: true },
            },
        });
        const tokens = await this.generateTokens(userWithRole);
        this.logger.log(`New user registered via OTP: ${user.username} (unit ${baseUnit})`);
        return {
            ...tokens,
            user: this.buildUserResponse(userWithRole),
        };
    }
    async ensureUniqueUsername(base) {
        if (!(await this.usersService.findByUsername(base)))
            return base;
        for (let i = 0; i < 20; i += 1) {
            const candidate = `${base}_${Date.now().toString().slice(-4)}${i || ''}`;
            if (!(await this.usersService.findByUsername(candidate)))
                return candidate;
        }
        return `${base}_${Date.now().toString().slice(-4)}`;
    }
    async resolveDefaultRoleId() {
        const byName = await this.prisma.role.findFirst({
            where: { name: 'WARGA', isActive: true },
            select: { id: true },
        });
        if (byName)
            return byName.id;
        const fallback = this.configService.get('DEFAULT_USER_ROLE_ID');
        if (fallback) {
            const byEnv = await this.prisma.role.findUnique({
                where: { id: fallback },
                select: { id: true },
            });
            if (byEnv)
                return byEnv.id;
        }
        throw new common_1.InternalServerErrorException('Role WARGA tidak ditemukan. Hubungi administrator.');
    }
    async ensureUniqueEmail(base) {
        const exists = await this.usersService.findByEmail(base);
        if (!exists)
            return base;
        const [local, domain] = base.split('@');
        let guard = 0;
        let candidate = `${local}${Date.now().toString().slice(-4)}@${domain}`;
        while (guard < 20) {
            const taken = await this.usersService.findByEmail(candidate);
            if (!taken)
                return candidate;
            candidate = `${local}${Date.now().toString().slice(-4)}${guard}@${domain}`;
            guard += 1;
        }
        return candidate;
    }
    checkThrottle(key) {
        const now = Date.now();
        const window = AuthService_1.THROTTLE_WINDOW_MS;
        const recent = (this.requestThrottle.get(key) ?? []).filter((ts) => now - ts < window);
        if (recent.length >= AuthService_1.THROTTLE_MAX) {
            throw new common_1.BadRequestException('Terlalu banyak permintaan reset password. Silakan coba lagi dalam beberapa menit.');
        }
        recent.push(now);
        this.requestThrottle.set(key, recent);
    }
    hashOtp(userId, code) {
        const secret = this.configService.get('OTP_HASH_SECRET') ||
            this.configService.get('jwt.secret') ||
            'default-secret-key';
        return crypto
            .createHash('sha256')
            .update(`${code}:${userId}:${secret}`)
            .digest('hex');
    }
    maskPhone(normalized) {
        const local = normalized.startsWith('62')
            ? '0' + normalized.slice(2)
            : normalized;
        if (local.length <= 6)
            return '••••';
        return `${local.slice(0, 4)}****${local.slice(-2)}`;
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
    getRefreshTokenExpiryDate() {
        const expiration = this.configService.get('jwt.refreshExpiresIn') || '7d';
        const expiresInSeconds = this.parseExpirationToSeconds(expiration);
        return new Date(Date.now() + expiresInSeconds * 1000);
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
AuthService.OTP_TTL_MS = 10 * 60_000;
AuthService.MAX_VERIFY_ATTEMPTS = 5;
AuthService.THROTTLE_WINDOW_MS = 15 * 60_000;
AuthService.THROTTLE_MAX = 3;
AuthService.RESEND_COOLDOWN_MS = 60_000;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService,
        whatsapp_blast_service_1.WhatsappBlastService])
], AuthService);
//# sourceMappingURL=auth.service.js.map