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
exports.RolesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesRepository = class RolesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [roles, total] = await Promise.all([
            this.prisma.role.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
            }),
            this.prisma.role.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { roles, total };
    }
    async findById(id) {
        return this.prisma.role.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async findByName(name) {
        return this.prisma.role.findFirst({
            where: { name, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.role.create({
            data,
        });
    }
    async update(id, data) {
        return this.prisma.role.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        return this.prisma.role.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
    async restore(id) {
        return this.prisma.role.update({
            where: { id },
            data: { deletedAt: null, isActive: true },
        });
    }
    async count(where) {
        return this.prisma.role.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.role.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
};
exports.RolesRepository = RolesRepository;
exports.RolesRepository = RolesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesRepository);
//# sourceMappingURL=roles.repository.js.map