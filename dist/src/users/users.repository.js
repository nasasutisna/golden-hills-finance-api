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
const DEFAULT_USER_INCLUDE = {
    role: {
        select: {
            id: true,
            name: true,
            description: true,
        },
    },
    resident: {
        select: {
            id: true,
            residentCode: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            houseBlock: {
                select: {
                    id: true,
                    blockCode: true,
                    blockName: true,
                },
            },
        },
    },
};
let UsersRepository = class UsersRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy, include } = params;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
                include: include || DEFAULT_USER_INCLUDE,
            }),
            this.prisma.user.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { users, total };
    }
    async findById(id, include) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            include: include || DEFAULT_USER_INCLUDE,
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByUsername(username, include) {
        return this.prisma.user.findFirst({
            where: { username, deletedAt: null },
            include: include || undefined,
        });
    }
    async findByEmail(email, include) {
        return this.prisma.user.findFirst({
            where: { email, deletedAt: null },
            include: include || undefined,
        });
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
        try {
            return await this.prisma.user.update({
                where: { id },
                data,
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('User not found');
            }
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Username or email already exists');
            }
            throw error;
        }
    }
    async delete(id) {
        try {
            return await this.prisma.user.delete({
                where: { id },
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('User not found');
            }
            if (error.code === 'P2003') {
                throw new common_1.ConflictException('Cannot permanently delete user: this user still has related records ' +
                    '(e.g. transactions, payments, approvals). Deactivate the user instead.');
            }
            throw error;
        }
    }
    async restore(id) {
        try {
            return await this.prisma.user.update({
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
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('User not found');
            }
            throw error;
        }
    }
    async updatePassword(id, hashedPassword) {
        try {
            await this.prisma.user.update({
                where: { id },
                data: { password: hashedPassword },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('User not found');
            }
            throw error;
        }
    }
    async linkResident(residentId, userId) {
        try {
            await this.prisma.resident.update({
                where: { id: residentId },
                data: { userId },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Resident not found');
            }
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Resident is already linked to another user');
            }
            throw error;
        }
    }
    async unlinkResident(residentId) {
        try {
            await this.prisma.resident.update({
                where: { id: residentId },
                data: { userId: null },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Resident not found');
            }
            throw error;
        }
    }
    async unlinkResidentByUserId(userId) {
        await this.prisma.resident.updateMany({
            where: { userId },
            data: { userId: null },
        });
    }
    async findResidentById(residentId) {
        return this.prisma.resident.findFirst({
            where: { id: residentId, deletedAt: null },
            include: {
                houseBlock: {
                    select: { id: true, blockCode: true, blockName: true },
                },
            },
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