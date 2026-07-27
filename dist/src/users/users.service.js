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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const users_repository_1 = require("./users.repository");
const whatsapp_blast_service_1 = require("../whatsapp-blast/whatsapp-blast.service");
let UsersService = UsersService_1 = class UsersService {
    constructor(usersRepository, configService, whatsappBlastService) {
        this.usersRepository = usersRepository;
        this.configService = configService;
        this.whatsappBlastService = whatsappBlastService;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, searchFields, filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (search && searchFields) {
            const fields = searchFields.split(',');
            where.OR = fields.map((field) => ({
                [field]: { contains: search },
            }));
        }
        if (filters) {
            where = { ...where, ...filters };
        }
        const { users, total } = await this.usersRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: users.map((user) => this.excludeSensitiveData(user)),
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    async findById(id, include) {
        const user = await this.usersRepository.findById(id, include);
        return this.excludeSensitiveData(user);
    }
    async findByUsername(username, include) {
        const user = await this.usersRepository.findByUsername(username, include);
        return user ?? null;
    }
    async findByEmail(email) {
        return this.usersRepository.findByEmail(email);
    }
    async create(createUserDto) {
        const mode = createUserDto.passwordMode ?? 'manual';
        const plainPassword = this.resolvePlainPassword(createUserDto, mode);
        const hashedPassword = await this.hashPassword(plainPassword);
        const { residentId, passwordMode, sendViaWhatsapp, password: _plain, ...userData } = createUserDto;
        let user;
        try {
            user = await this.usersRepository.create({
                ...userData,
                password: hashedPassword,
            });
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error('Error creating user:', error);
            throw error;
        }
        let resident = user.resident ?? null;
        if (residentId) {
            try {
                await this.usersRepository.unlinkResidentByUserId(user.id);
                await this.usersRepository.linkResident(residentId, user.id);
                resident = await this.usersRepository.findResidentById(residentId);
            }
            catch (error) {
                this.logger.error(`User ${user.username} created but resident link failed: ${error?.message}`);
                throw error;
            }
        }
        let whatsappResult = { sent: false };
        if (sendViaWhatsapp) {
            const phone = resident?.phoneNumber ?? user.phoneNumber ?? null;
            whatsappResult = await this.sendCredentialsViaWhatsapp({
                phoneNumber: phone,
                firstName: user.firstName,
                username: user.username,
                password: plainPassword,
            });
        }
        this.logger.log(`User created: ${user.username}`);
        const safeUser = this.excludeSensitiveData({ ...user, resident });
        return {
            ...safeUser,
            generatedPassword: mode === 'generate' ? plainPassword : undefined,
            whatsappSent: whatsappResult.sent,
            whatsappError: whatsappResult.error,
        };
    }
    async update(id, updateUserDto) {
        const { residentId, passwordMode: _pm, sendViaWhatsapp: _wa, ...userData } = updateUserDto;
        let user;
        try {
            user = await this.usersRepository.update(id, userData);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Error updating user:', error);
            throw error;
        }
        if (residentId !== undefined) {
            await this.usersRepository.unlinkResidentByUserId(id);
            if (residentId) {
                await this.usersRepository.linkResident(residentId, id);
            }
        }
        this.logger.log(`User updated: ${user.username}`);
        return this.excludeSensitiveData(await this.usersRepository.findById(id));
    }
    async delete(id) {
        const user = await this.usersRepository.delete(id);
        this.logger.log(`User deleted (hard): ${user.username}`);
        return this.excludeSensitiveData(user);
    }
    async restore(id) {
        const user = await this.usersRepository.restore(id);
        this.logger.log(`User restored: ${user.username}`);
        return this.excludeSensitiveData(user);
    }
    async deactivate(id) {
        const user = await this.usersRepository.update(id, { isActive: false });
        this.logger.log(`User deactivated: ${user.username}`);
        return this.excludeSensitiveData(user);
    }
    async activate(id) {
        const user = await this.usersRepository.update(id, { isActive: true });
        this.logger.log(`User activated: ${user.username}`);
        return this.excludeSensitiveData(user);
    }
    async resetPassword(id, dto) {
        const mode = dto.passwordMode ?? 'manual';
        const plainPassword = this.resolvePlainPassword(dto, mode);
        const hashedPassword = await this.hashPassword(plainPassword);
        await this.usersRepository.updatePassword(id, hashedPassword);
        let whatsappResult = { sent: false };
        if (dto.sendViaWhatsapp) {
            const user = await this.usersRepository.findById(id);
            const phone = user?.resident?.phoneNumber ?? user?.phoneNumber ?? null;
            whatsappResult = await this.sendCredentialsViaWhatsapp({
                phoneNumber: phone,
                firstName: user?.firstName ?? 'Pengguna',
                username: user?.username ?? '',
                password: plainPassword,
            });
        }
        this.logger.log(`Password reset for user: ${id}`);
        return {
            generatedPassword: mode === 'generate' ? plainPassword : undefined,
            whatsappSent: whatsappResult.sent,
            whatsappError: whatsappResult.error,
        };
    }
    async updatePassword(id, newPassword) {
        const hashed = await this.hashPassword(newPassword);
        await this.usersRepository.updatePassword(id, hashed);
        this.logger.log(`Password updated for user: ${id}`);
    }
    async verifyPassword(userId, plainPassword) {
        const user = await this.usersRepository.findById(userId);
        if (!user?.password) {
            return false;
        }
        try {
            return await bcrypt.compare(plainPassword, user.password);
        }
        catch (error) {
            this.logger.warn(`Invalid password hash for user ${userId}`);
            return false;
        }
    }
    async hashPassword(plain) {
        const rounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '10'), 10);
        return bcrypt.hash(plain, rounds);
    }
    resolvePlainPassword(dto, mode) {
        if (mode === 'generate') {
            return this.generateStrongPassword();
        }
        if (!dto.password) {
            throw new common_1.BadRequestException('Password is required when passwordMode is "manual"');
        }
        return dto.password;
    }
    generateStrongPassword(length = 12) {
        const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower = 'abcdefghijkmnopqrstuvwxyz';
        const digits = '23456789';
        const special = '@$!%*?&';
        const all = upper + lower + digits + special;
        const pick = (set) => set[Math.floor(Math.random() * set.length)];
        const required = [pick(upper), pick(lower), pick(digits), pick(special)];
        const remaining = Array.from({ length: Math.max(0, length - required.length) }, () => pick(all));
        const chars = [...required, ...remaining];
        for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
    }
    async sendCredentialsViaWhatsapp(params) {
        if (!params.phoneNumber) {
            return {
                sent: false,
                error: 'Nomor WhatsApp warga tidak tersedia (resident.phoneNumber kosong).',
            };
        }
        const message = `Halo ${params.firstName}, kredensial akun Golden Hills Anda:\n\n` +
            `Username: ${params.username}\n` +
            `Password sementara: ${params.password}\n\n` +
            `Mohon login dan segera ganti password Anda. Terima kasih.`;
        try {
            await this.whatsappBlastService.sendTest({
                phoneNumber: params.phoneNumber,
                message,
            });
            return { sent: true };
        }
        catch (err) {
            return { sent: false, error: err?.message ?? String(err) };
        }
    }
    excludeSensitiveData(user) {
        if (!user)
            return user;
        const { password, refreshToken, refreshTokenExpiry, ...safeUser } = user;
        return safeUser;
    }
    async count(where) {
        return this.usersRepository.count(where);
    }
    async exists(id) {
        return this.usersRepository.exists(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        config_1.ConfigService,
        whatsapp_blast_service_1.WhatsappBlastService])
], UsersService);
//# sourceMappingURL=users.service.js.map