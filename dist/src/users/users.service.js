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
const users_repository_1 = require("./users.repository");
let UsersService = UsersService_1 = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
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
        try {
            const user = await this.usersRepository.create(createUserDto);
            this.logger.log(`User created: ${user.username}`);
            return this.excludeSensitiveData(user);
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error('Error creating user:', error);
            throw error;
        }
    }
    async update(id, updateUserDto) {
        try {
            const user = await this.usersRepository.update(id, updateUserDto);
            this.logger.log(`User updated: ${user.username}`);
            return this.excludeSensitiveData(user);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Error updating user:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const user = await this.usersRepository.softDelete(id);
        this.logger.log(`User soft deleted: ${user.username}`);
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
    async updatePassword(id, newPassword) {
        await this.usersRepository.updatePassword(id, newPassword);
        this.logger.log(`Password updated for user: ${id}`);
    }
    excludeSensitiveData(user) {
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
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map