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
exports.FeeTypesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FeeTypesRepository = class FeeTypesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const [feeTypes, total] = await Promise.all([
            this.prisma.feeType.findMany({
                where: { ...where, deletedAt: null },
                skip,
                take,
                orderBy,
            }),
            this.prisma.feeType.count({ where: { ...where, deletedAt: null } }),
        ]);
        return { feeTypes, total };
    }
    async findById(id) {
        const feeType = await this.prisma.feeType.findFirst({
            where: { id, deletedAt: null },
        });
        if (!feeType) {
            throw new common_1.NotFoundException('Fee type not found');
        }
        return feeType;
    }
    async findByFeeCode(feeCode) {
        return this.prisma.feeType.findFirst({
            where: { feeCode, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.feeType.create({ data });
    }
    async update(id, data) {
        try {
            return await this.prisma.feeType.update({
                where: { id },
                data,
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Fee type not found');
            }
            throw error;
        }
    }
    async softDelete(id) {
        return this.update(id, {
            deletedAt: new Date(),
            isActive: false,
        });
    }
    async restore(id) {
        return this.prisma.feeType.update({
            where: { id },
            data: { deletedAt: null, isActive: true },
        });
    }
    async count(where) {
        return this.prisma.feeType.count({
            where: { ...where, deletedAt: null },
        });
    }
    async exists(id) {
        const count = await this.prisma.feeType.count({
            where: { id, deletedAt: null },
        });
        return count > 0;
    }
    async getActiveFeeTypes() {
        return this.prisma.feeType.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: { feeCode: 'asc' },
        });
    }
    async getByCategory(category) {
        return this.prisma.feeType.findMany({
            where: { feeCategory: category, deletedAt: null },
            orderBy: { feeCode: 'asc' },
        });
    }
};
exports.FeeTypesRepository = FeeTypesRepository;
exports.FeeTypesRepository = FeeTypesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeeTypesRepository);
//# sourceMappingURL=fee-types.repository.js.map