"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationConfig = exports.paginationConfig = void 0;
const config_1 = require("@nestjs/config");
exports.paginationConfig = (0, config_1.registerAs)('pagination', () => ({
    defaultPage: parseInt(process.env.DEFAULT_PAGE || '1', 10),
    defaultLimit: parseInt(process.env.DEFAULT_LIMIT || '10', 10),
    maxLimit: parseInt(process.env.MAX_LIMIT || '100', 10),
}));
const getPaginationConfig = () => exports.paginationConfig;
exports.getPaginationConfig = getPaginationConfig;
//# sourceMappingURL=pagination.config.js.map