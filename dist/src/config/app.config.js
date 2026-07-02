"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppConfig = exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    appName: process.env.APP_NAME || 'Golden Hills Finance Management System',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'debug',
}));
const getAppConfig = () => exports.appConfig;
exports.getAppConfig = getAppConfig;
//# sourceMappingURL=app.config.js.map