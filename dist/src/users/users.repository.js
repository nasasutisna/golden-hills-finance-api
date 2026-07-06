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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersRepository = class UsersRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapLegacyUser(row) {
        if (!row) {
            return null;
        }
        return {
            id: row.id ? String(row.id) : undefined,
            username: row.username,
            email: row.email ?? `${row.username}@local`,
            password: row.password ?? row.password ?? null,
            firstName: row.first_name ?? row.firstName ?? '',
            lastName: row.last_name ?? row.lastName ?? '',
            isActive: row.is_active !== undefined ? Boolean(row.is_active) : Boolean(row.isActive),
            roleId: row.role_id ? String(row.role_id) : row.roleId ? String(row.roleId) : null,
            lastLoginAt: row.last_login_at ?? row.lastLoginAt ?? null,
            refreshToken: row.refresh_token ?? row.refreshToken ?? null,
            refreshTokenExpiry: row.refresh_token_expiry ?? row.refreshTokenExpiry ?? null,
            createdAt: row.created_at ?? row.createdAt ?? null,
            updatedAt: row.updated_at ?? row.updatedAt ?? null,
        };
    }
    async findAll(params) {
        const { skip, take, where, orderBy, include } = params;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: include || {
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
            }),
            this.prisma.user.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { users, total };
    }
    async findById(id, include) {
        if (include) {
            const user = await this.prisma.user.findFirst({
                where: { id, deletedAt: null },
                include,
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return user;
        }
        const rows = await this.prisma.$queryRawUnsafe('SELECT id, username, email, password, first_name, last_name, is_active, role_id, last_login_at, refresh_token, refresh_token_expiry, created_at, updated_at FROM users WHERE id = ? LIMIT 1', String(id));
        const user = this.mapLegacyUser(rows[0]);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByUsername(username, include) {
        if (include) {
            return await this.prisma.user.findFirst({
                where: { username, deletedAt: null },
                include,
            });
        }
        const rows = await this.prisma.$queryRawUnsafe('SELECT id, username, email, password, first_name, last_name, is_active, role_id, last_login_at, refresh_token, refresh_token_expiry, created_at, updated_at FROM users WHERE username = ? LIMIT 1', username);
        return this.mapLegacyUser(rows[0]);
    }
    async findByEmail(email) {
        const rows = await this.prisma.$queryRawUnsafe('SELECT id, username, email, password, first_name, last_name, is_active, role_id, last_login_at, refresh_token, refresh_token_expiry, created_at, updated_at FROM users WHERE email = ? LIMIT 1', email);
        return this.mapLegacyUser(rows[0]);
    }
    async create(data) {
        try {
            return await this.prisma.user.create({
                data,
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            permissions: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Username or email already exists');
            }
            throw error;
        }
    }
    async update(id, data) {
        const updates = [];
        const values = [];
        if (data.lastLoginAt !== undefined) {
            updates.push('last_login_at = ?');
            values.push(data.lastLoginAt);
        }
        if (data.isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(data.isActive ? 1 : 0);
        }
        if (data.password !== undefined) {
            updates.push('password = ?');
            values.push(data.password);
        }
        if (updates.length === 0) {
            return this.findById(id);
        }
        values.push(String(id));
        await this.prisma.$executeRawUnsafe(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, ...values);
        return this.findById(id);
    }
    async softDelete(id) {
        return this.update(id, {
            deletedAt: new Date(),
            isActive: false,
        });
    }
    async restore(id) {
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: null, isActive: true },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        permissions: true,
                    },
                },
            },
        });
    }
    async updatePassword(id, newPassword) {
        await this.prisma.user.update({
            where: { id },
            data: { password: newPassword },
        });
    }
    async count(where) {
        return this.prisma.user.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.user.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map