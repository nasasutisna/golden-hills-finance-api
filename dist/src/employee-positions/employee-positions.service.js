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
var EmployeePositionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeePositionsService = void 0;
const common_1 = require("@nestjs/common");
const employee_positions_repository_1 = require("./employee-positions.repository");
let EmployeePositionsService = EmployeePositionsService_1 = class EmployeePositionsService {
    constructor(employeePositionsRepository) {
        this.employeePositionsRepository = employeePositionsRepository;
        this.logger = new common_1.Logger(EmployeePositionsService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'level', sortOrder = 'desc', search, searchFields, filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (search && searchFields) {
            const fields = searchFields.split(',');
            where.OR = fields.map((field) => ({
                [field]: { contains: search, mode: 'insensitive' },
            }));
        }
        if (filters) {
            where = { ...where, ...filters };
        }
        const { positions, total } = await this.employeePositionsRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: positions,
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
        return await this.employeePositionsRepository.findById(id);
    }
    async create(createEmployeePositionDto) {
        const existingPosition = await this.employeePositionsRepository.findByPositionCode(createEmployeePositionDto.positionCode);
        if (existingPosition) {
            throw new common_1.ConflictException('Position code already exists');
        }
        try {
            const position = await this.employeePositionsRepository.create(createEmployeePositionDto);
            this.logger.log(`Employee position created: ${position.positionCode}`);
            return position;
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error('Error creating employee position:', error);
            throw error;
        }
    }
    async update(id, updateEmployeePositionDto) {
        try {
            const position = await this.employeePositionsRepository.update(id, updateEmployeePositionDto);
            this.logger.log(`Employee position updated: ${position.positionCode}`);
            return position;
        }
        catch (error) {
            this.logger.error('Error updating employee position:', error);
            throw error;
        }
    }
    async softDelete(id) {
        const position = await this.employeePositionsRepository.softDelete(id);
        this.logger.log(`Employee position soft deleted: ${position.positionCode}`);
        return position;
    }
    async restore(id) {
        const position = await this.employeePositionsRepository.restore(id);
        this.logger.log(`Employee position restored: ${position.positionCode}`);
        return position;
    }
    async getActivePositions() {
        return await this.employeePositionsRepository.getActivePositions();
    }
    async getByDepartment(department) {
        return await this.employeePositionsRepository.getByDepartment(department);
    }
    async count(where) {
        return await this.employeePositionsRepository.count(where);
    }
    async exists(id) {
        return await this.employeePositionsRepository.exists(id);
    }
};
exports.EmployeePositionsService = EmployeePositionsService;
exports.EmployeePositionsService = EmployeePositionsService = EmployeePositionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_positions_repository_1.EmployeePositionsRepository])
], EmployeePositionsService);
//# sourceMappingURL=employee-positions.service.js.map