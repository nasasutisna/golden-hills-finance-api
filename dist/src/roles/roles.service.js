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
var RolesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const roles_repository_1 = require("./roles.repository");
let RolesService = RolesService_1 = class RolesService {
    constructor(rolesRepository) {
        this.rolesRepository = rolesRepository;
        this.logger = new common_1.Logger(RolesService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', search, searchFields, filters } = queryOptions;
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
        const { roles, total } = await this.rolesRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: roles,
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
    async findById(id) {
        const role = await this.rolesRepository.findById(id);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async findByName(name) {
        return this.rolesRepository.findByName(name);
    }
    async create(createRoleDto) {
        const existingRole = await this.rolesRepository.findByName(createRoleDto.name);
        if (existingRole) {
            throw new common_1.ConflictException('Role name already exists');
        }
        const role = await this.rolesRepository.create(createRoleDto);
        this.logger.log(`Role created: ${role.name}`);
        return role;
    }
    async update(id, updateRoleDto) {
        await this.findById(id);
        if (updateRoleDto.name) {
            const existingRole = await this.rolesRepository.findByName(updateRoleDto.name);
            if (existingRole && existingRole.id !== id) {
                throw new common_1.ConflictException('Role name already exists');
            }
        }
        const role = await this.rolesRepository.update(id, updateRoleDto);
        this.logger.log(`Role updated: ${role.name}`);
        return role;
    }
    async softDelete(id) {
        await this.findById(id);
        const role = await this.rolesRepository.softDelete(id);
        this.logger.log(`Role soft deleted: ${role.name}`);
        return role;
    }
    async restore(id) {
        const role = await this.rolesRepository.restore(id);
        this.logger.log(`Role restored: ${role.name}`);
        return role;
    }
    async count(where) {
        return this.rolesRepository.count(where);
    }
    async exists(id) {
        return this.rolesRepository.exists(id);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = RolesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [roles_repository_1.RolesRepository])
], RolesService);
//# sourceMappingURL=roles.service.js.map