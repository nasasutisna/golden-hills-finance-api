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
exports.SalaryComponentsService = void 0;
const common_1 = require("@nestjs/common");
const salary_components_repository_1 = require("./salary-components.repository");
let SalaryComponentsService = class SalaryComponentsService {
    constructor(repository) {
        this.repository = repository;
    }
    async create(createSalaryComponentDto) {
        const existing = await this.repository.findByComponentCode(createSalaryComponentDto.componentCode);
        if (existing) {
            throw new common_1.ConflictException(`Component with code ${createSalaryComponentDto.componentCode} already exists`);
        }
        return this.repository.create(createSalaryComponentDto);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, componentType, calculationType, isActive, isTaxSubject, search } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (componentType) {
            where.componentType = componentType;
        }
        if (calculationType) {
            where.calculationType = calculationType;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (isTaxSubject !== undefined) {
            where.isTaxSubject = isTaxSubject;
        }
        if (search) {
            where.OR = [
                { componentCode: { contains: search } },
                { componentName: { contains: search } },
                { description: { contains: search } },
            ];
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { calculationOrder: 'asc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const component = await this.repository.findById(id);
        if (!component) {
            throw new common_1.NotFoundException(`Salary component with ID ${id} not found`);
        }
        return component;
    }
    async update(id, updateSalaryComponentDto) {
        if (updateSalaryComponentDto.componentCode) {
            const existing = await this.repository.findByComponentCode(updateSalaryComponentDto.componentCode);
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Component with code ${updateSalaryComponentDto.componentCode} already exists`);
            }
        }
        return this.repository.update(id, updateSalaryComponentDto);
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.softDelete(id);
    }
    async getActiveComponents() {
        return this.repository.findActive();
    }
};
exports.SalaryComponentsService = SalaryComponentsService;
exports.SalaryComponentsService = SalaryComponentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [salary_components_repository_1.SalaryComponentsRepository])
], SalaryComponentsService);
//# sourceMappingURL=salary-components.service.js.map