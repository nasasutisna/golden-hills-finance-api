"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationPipe = void 0;
const common_1 = require("@nestjs/common");
class ValidationPipe extends common_1.ValidationPipe {
    constructor(options) {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            ...options,
        });
    }
    flattenValidationErrors(errors) {
        return this.mapErrorsToMessages(errors);
    }
    mapErrorsToMessages(errors, parentPath = '') {
        const messages = [];
        errors.forEach((error) => {
            const path = parentPath ? `${parentPath}.${error.property}` : error.property;
            if (error.constraints) {
                Object.values(error.constraints).forEach((constraint) => {
                    messages.push(`${path}: ${constraint}`);
                });
            }
            if (error.children && error.children.length > 0) {
                messages.push(...this.mapErrorsToMessages(error.children, path));
            }
        });
        return messages;
    }
}
exports.ValidationPipe = ValidationPipe;
//# sourceMappingURL=validation.pipe.js.map