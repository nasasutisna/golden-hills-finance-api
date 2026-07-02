"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtConfig = exports.jwtConfig = void 0;
const config_1 = require("@nestjs/config");
exports.jwtConfig = (0, config_1.registerAs)('jwt', () => ({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
const getJwtConfig = () => exports.jwtConfig;
exports.getJwtConfig = getJwtConfig;
//# sourceMappingURL=jwt.config.js.map