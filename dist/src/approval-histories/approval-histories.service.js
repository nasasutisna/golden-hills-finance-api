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
var ApprovalHistoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalHistoriesService = void 0;
const common_1 = require("@nestjs/common");
const approval_histories_repository_1 = require("./approval-histories.repository");
let ApprovalHistoriesService = ApprovalHistoriesService_1 = class ApprovalHistoriesService {
    constructor(approvalHistoriesRepository) {
        this.approvalHistoriesRepository = approvalHistoriesRepository;
        this.logger = new common_1.Logger(ApprovalHistoriesService_1.name);
    }
    async findAll(queryOptions) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filters } = queryOptions;
        const skip = (page - 1) * limit;
        let where = {};
        if (filters) {
            where = { ...where, ...filters };
        }
        const { histories, total } = await this.approvalHistoriesRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: histories,
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
    async findByEntity(entityType, entityId) {
        return await this.approvalHistoriesRepository.findByEntity(entityType, entityId);
    }
    async create(createApprovalHistoryDto) {
        const history = await this.approvalHistoriesRepository.create(createApprovalHistoryDto);
        this.logger.log(`Approval history created for ${history.entityType}:${history.entityId}`);
        return history;
    }
    async count(where) {
        return await this.approvalHistoriesRepository.count(where);
    }
};
exports.ApprovalHistoriesService = ApprovalHistoriesService;
exports.ApprovalHistoriesService = ApprovalHistoriesService = ApprovalHistoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [approval_histories_repository_1.ApprovalHistoriesRepository])
], ApprovalHistoriesService);
//# sourceMappingURL=approval-histories.service.js.map