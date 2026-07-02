"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = exports.databaseConfig = void 0;
const config_1 = require("@nestjs/config");
exports.databaseConfig = (0, config_1.registerAs)('database', () => ({
    url: process.env.DATABASE_URL,
}));
const getDatabaseConfig = () => exports.databaseConfig;
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map