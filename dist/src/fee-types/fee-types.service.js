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
var FeeTypesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeTypesService = void 0;
const common_1 = require("@nestjs/common");
const fee_types_repository_1 = require("./fee-types.repository");
let FeeTypesService = FeeTypesService_1 = class FeeTypesService {
    constructor(feeTypesRepository) {
        this.feeTypesRepository = feeTypesRepository;
        this.logger = new common_1.Logger(FeeTypesService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'feeCode', sortOrder = 'asc', search, searchFields, filters } = queryOptions;
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
        const { feeTypes, total } = await this.feeTypesRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: feeTypes,
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
        return await this.feeTypesRepository.findById(id);
    }
    async create(createFeeTypeDto) {
        const existingFeeType = await this.feeTypesRepository.findByFeeCode(createFeeTypeDto.feeCode);
        if (existingFeeType) {
            throw new common_1.ConflictException('Fee code already exists');
        }
        try {
            const feeType = await this.feeTypesRepository.create(createFeeTypeDto);
            this.logger.log(`Fee type created: ${feeType.feeCode}`);
            return feeType;
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error('Error creating fee type:', error);
            throw error;
        }
    }
    async update(id, updateFeeTypeDto) {
        try {
            const feeType = await this.feeTypesRepository.update(id, updateFeeTypeDto);
            this.logger.log(`Fee type updated: ${feeType.feeCode}`);
            return feeType;
        }
        catch (error) {
            this.logger.error('Error updating fee type:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const feeType = await this.feeTypesRepository.softDelete(id);
        this.logger.log(`Fee type soft deleted: ${feeType.feeCode}`);
        return feeType;
    }
    async restore(id) {
        const feeType = await this.feeTypesRepository.restore(id);
        this.logger.log(`Fee type restored: ${feeType.feeCode}`);
        return feeType;
    }
    async getActiveFeeTypes() {
        return await this.feeTypesRepository.getActiveFeeTypes();
    }
    async getByCategory(category) {
        return await this.feeTypesRepository.getByCategory(category);
    }
    async count(where) {
        return await this.feeTypesRepository.count(where);
    }
    async exists(id) {
        return await this.feeTypesRepository.exists(id);
    }
};
exports.FeeTypesService = FeeTypesService;
exports.FeeTypesService = FeeTypesService = FeeTypesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fee_types_repository_1.FeeTypesRepository])
], FeeTypesService);
//# sourceMappingURL=fee-types.service.js.map