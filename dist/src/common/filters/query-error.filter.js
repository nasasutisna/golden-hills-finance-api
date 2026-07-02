"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QueryErrorFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryErrorFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const response_dto_1 = require("../dto/response.dto");
let QueryErrorFilter = QueryErrorFilter_1 = class QueryErrorFilter {
    constructor() {
        this.logger = new common_1.Logger(QueryErrorFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = this.getStatus(exception.code);
        const message = this.getMessage(exception);
        const errorResponse = new response_dto_1.ResponseDto(status, message, null, [exception.message]);
        errorResponse.path = request.url;
        errorResponse.timestamp = new Date().toISOString();
        this.logger.error(`Prisma Error: ${exception.code} - ${exception.message} - Meta: ${JSON.stringify(exception.meta)}`);
        response.status(status).json(errorResponse);
    }
    getStatus(code) {
        switch (code) {
            case 'P2002':
                return 409;
            case 'P2025':
                return 404;
            case 'P2003':
                return 400;
            case 'P2004':
                return 400;
            case 'P2006':
                return 400;
            case 'P2011':
                return 400;
            case 'P2014':
                return 400;
            case 'P2015':
                return 404;
            case 'P2016':
                return 400;
            case 'P2017':
                return 400;
            case 'P2018':
                return 400;
            case 'P2019':
                return 400;
            case 'P2020':
                return 400;
            case 'P2021':
                return 400;
            case 'P2022':
                return 400;
            case 'P2023':
                return 400;
            case 'P2024':
                return 400;
            default:
                return 500;
        }
    }
    getMessage(exception) {
        switch (exception.code) {
            case 'P2002':
                const constraint = exception.meta?.target;
                return `A record with this ${constraint?.join(', ')} already exists`;
            case 'P2025':
                return 'Record not found';
            case 'P2003':
                return 'Foreign key constraint violation';
            case 'P2004':
                return 'Database constraint violation';
            case 'P2006':
                return 'Invalid value provided';
            case 'P2011':
                return 'Null constraint violation';
            case 'P2014':
                return 'Required relation violation';
            case 'P2015':
                return 'Related record not found';
            case 'P2016':
                return 'Query interpretation error';
            case 'P2017':
                return 'Relation fields violation';
            case 'P2018':
                return 'Required connected records not found';
            case 'P2019':
                return 'Input validation error';
            case 'P2020':
                return 'Value out of range';
            case 'P2021':
                return 'Table does not exist';
            case 'P2022':
                return 'Column does not exist';
            case 'P2023':
                return 'Inconsistent column data';
            case 'P2024':
                return 'Connection pool timeout';
            default:
                return 'Database operation failed';
        }
    }
};
exports.QueryErrorFilter = QueryErrorFilter;
exports.QueryErrorFilter = QueryErrorFilter = QueryErrorFilter_1 = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError)
], QueryErrorFilter);
//# sourceMappingURL=query-error.filter.js.map