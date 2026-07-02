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
exports.SalaryComponentsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SalaryComponentsRepository = class SalaryComponentsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [components, total] = await Promise.all([
            this.prisma.salaryComponent.findMany({
                where,
                skip,
                take,
                orderBy,
            }),
            this.prisma.salaryComponent.count({ where }),
        ]);
        return { components, total };
    }
    async findById(id) {
        return this.prisma.salaryComponent.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async findByComponentCode(componentCode) {
        return this.prisma.salaryComponent.findFirst({
            where: { componentCode, deletedAt: null },
        });
    }
    async findActive() {
        return this.prisma.salaryComponent.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: { calculationOrder: 'asc' },
        });
    }
    async create(data) {
        return this.prisma.salaryComponent.create({
            data,
        });
    }
    async update(id, data) {
        const component = await this.findById(id);
        if (!component) {
            throw new common_1.NotFoundException(`Salary component with ID ${id} not found`);
        }
        return this.prisma.salaryComponent.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        const component = await this.findById(id);
        if (!component) {
            throw new common_1.NotFoundException(`Salary component with ID ${id} not found`);
        }
        return this.prisma.salaryComponent.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async count(where) {
        return this.prisma.salaryComponent.count({ where });
    }
};
exports.SalaryComponentsRepository = SalaryComponentsRepository;
exports.SalaryComponentsRepository = SalaryComponentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalaryComponentsRepository);
//# sourceMappingURL=salary-components.repository.js.map