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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        const connectionString = process.env.DATABASE_URL;
        const adapter = new adapter_mariadb_1.PrismaMariaDb(connectionString);
        super({
            adapter,
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'event' },
                { level: 'warn', emit: 'event' },
            ],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
        if (process.env.NODE_ENV === 'development') {
            this.$on('query', (e) => {
                this.logger.debug(`Query: ${e.query}`);
                this.logger.debug(`Params: ${e.params}`);
                this.logger.debug(`Duration: ${e.duration}ms`);
            });
        }
        this.$on('error', (e) => {
            this.logger.error(`Error: ${e.message}`);
        });
        this.$on('warn', (e) => {
            this.logger.warn(`Warning: ${e.message}`);
        });
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Successfully connected to database');
        }
        catch (error) {
            this.logger.error('Failed to connect to database', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Disconnected from database');
    }
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production')
            return;
        const models = Reflect.ownKeys(this).filter((key) => typeof key === 'string' && !key.startsWith('_'));
        return Promise.all(models.map((modelKey) => {
            const model = this[modelKey];
            if (model && typeof model === 'object' && 'deleteMany' in model) {
                return model.deleteMany();
            }
            return Promise.resolve();
        }));
    }
    async executeInTransaction(callback, maxRetries = 3) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await this.$transaction(async (tx) => {
                    return await callback(tx);
                });
            }
            catch (error) {
                attempt++;
                if (error.code === 'P2034' ||
                    error.code === 'P2038') {
                    if (attempt >= maxRetries) {
                        throw error;
                    }
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Transaction failed after maximum retries');
    }
    async softDelete(model, where, userId) {
        return model.update({
            where,
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }
    async exists(model, where) {
        const count = await model.count({ where });
        return count > 0;
    }
    async findOrThrow(model, where, errorMessage) {
        const record = await model.findFirst({ where });
        if (!record) {
            throw new Error(errorMessage || 'Record not found');
        }
        return record;
    }
    async paginate(model, params) {
        const { where, orderBy, page = 1, limit = 10, include, select } = params;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            model.findMany({
                where: { ...where, deletedAt: null },
                orderBy,
                skip,
                take: limit,
                include,
                select,
            }),
            model.count({ where: { ...where, deletedAt: null } }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        };
    }
    async search(model, params) {
        const { search, searchFields = [], where, page = 1, limit = 10, orderBy, include } = params;
        let searchWhere = where || {};
        if (search && searchFields.length > 0) {
            searchWhere = {
                ...searchWhere,
                OR: searchFields.map((field) => ({
                    [field]: { contains: search, mode: 'insensitive' },
                })),
            };
        }
        return this.paginate(model, {
            where: searchWhere,
            page,
            limit,
            orderBy,
            include,
        });
    }
    async filter(model, params) {
        const { filters, page = 1, limit = 10, orderBy, include } = params;
        return this.paginate(model, {
            where: filters,
            page,
            limit,
            orderBy,
            include,
        });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map