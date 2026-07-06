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
var ResidentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentsService = void 0;
const common_1 = require("@nestjs/common");
const residents_repository_1 = require("./residents.repository");
let ResidentsService = ResidentsService_1 = class ResidentsService {
    constructor(residentsRepository) {
        this.residentsRepository = residentsRepository;
        this.logger = new common_1.Logger(ResidentsService_1.name);
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
        const { residents, total } = await this.residentsRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: residents,
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
        return await this.residentsRepository.findById(id);
    }
    async findByResidentCode(residentCode) {
        const resident = await this.residentsRepository.findByResidentCode(residentCode);
        if (!resident) {
            throw new common_1.NotFoundException('Resident not found');
        }
        return resident;
    }
    async create(createResidentDto) {
        const existingResident = await this.residentsRepository.findByResidentCode(createResidentDto.residentCode);
        if (existingResident) {
            throw new common_1.ConflictException('Resident code already exists');
        }
        try {
            const resident = await this.residentsRepository.create(createResidentDto);
            this.logger.log(`Resident created: ${resident.residentCode}`);
            return resident;
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error('Error creating resident:', error);
            throw error;
        }
    }
    async update(id, updateResidentDto) {
        try {
            const resident = await this.residentsRepository.update(id, updateResidentDto);
            this.logger.log(`Resident updated: ${resident.residentCode}`);
            return resident;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Error updating resident:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const resident = await this.residentsRepository.softDelete(id);
        this.logger.log(`Resident soft deleted: ${resident.residentCode}`);
        return resident;
    }
    async restore(id) {
        const resident = await this.residentsRepository.restore(id);
        this.logger.log(`Resident restored: ${resident.residentCode}`);
        return resident;
    }
    async getByHouseBlock(houseBlockId) {
        return await this.residentsRepository.getByHouseBlock(houseBlockId);
    }
    async getActiveResidentsCount() {
        return await this.residentsRepository.getActiveResidentsCount();
    }
    async count(where) {
        return await this.residentsRepository.count(where);
    }
    async exists(id) {
        return await this.residentsRepository.exists(id);
    }
};
exports.ResidentsService = ResidentsService;
exports.ResidentsService = ResidentsService = ResidentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [residents_repository_1.ResidentsRepository])
], ResidentsService);
//# sourceMappingURL=residents.service.js.map