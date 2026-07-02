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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const query_options_dto_1 = require("../common/dto/query-options.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const parse_uuid_pipe_1 = require("../common/pipes/parse-uuid.pipe");
const http_response_decorator_1 = require("../common/decorators/http-response.decorator");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(createUserDto) {
        const user = await this.usersService.create(createUserDto);
        return {
            statusCode: 201,
            message: 'User created successfully',
            data: user,
        };
    }
    async findAll(queryOptions) {
        const result = await this.usersService.findAll(queryOptions);
        return {
            statusCode: 200,
            message: 'Users retrieved successfully',
            data: result.data,
            meta: result.meta,
        };
    }
    async findOne(id) {
        const user = await this.usersService.findById(id);
        return {
            statusCode: 200,
            message: 'User retrieved successfully',
            data: user,
        };
    }
    async update(id, updateUserDto) {
        const user = await this.usersService.update(id, updateUserDto);
        return {
            statusCode: 200,
            message: 'User updated successfully',
            data: user,
        };
    }
    async remove(id) {
        const user = await this.usersService.softDelete(id);
        return {
            statusCode: 200,
            message: 'User deleted successfully',
            data: user,
        };
    }
    async restore(id) {
        const user = await this.usersService.restore(id);
        return {
            statusCode: 200,
            message: 'User restored successfully',
            data: user,
        };
    }
    async deactivate(id) {
        const user = await this.usersService.deactivate(id);
        return {
            statusCode: 200,
            message: 'User deactivated successfully',
            data: user,
        };
    }
    async activate(id) {
        const user = await this.usersService.activate(id);
        return {
            statusCode: 200,
            message: 'User activated successfully',
            data: user,
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new user',
        description: 'Create a new user account (Admin only)',
    }),
    http_response_decorator_1.ApiResponseDecorators.created(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all users',
        description: 'Get paginated list of users (Admin, Manager)',
    }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_options_dto_1.QueryOptionsDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user by ID',
        description: 'Get user information by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update user',
        description: 'Update user information (Admin only)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft delete user',
        description: 'Soft delete user account (Admin only)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Restore deleted user',
        description: 'Restore a soft deleted user (Admin only)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "restore", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Deactivate user',
        description: 'Deactivate user account (Admin only)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Activate user',
        description: 'Activate user account (Admin only)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    http_response_decorator_1.ApiResponseDecorators.ok(),
    http_response_decorator_1.ApiResponseDecorators.standard(),
    __param(0, (0, common_1.Param)('id', parse_uuid_pipe_1.ParseUuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "activate", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map