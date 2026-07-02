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
exports.CommunityEventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const community_events_service_1 = require("./community-events.service");
const create_community_event_dto_1 = require("./dto/create-community-event.dto");
const update_community_event_dto_1 = require("./dto/update-community-event.dto");
const query_community_events_dto_1 = require("./dto/query-community-events.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let CommunityEventsController = class CommunityEventsController {
    constructor(communityEventsService) {
        this.communityEventsService = communityEventsService;
    }
    create(createCommunityEventDto, userId) {
        return this.communityEventsService.create(createCommunityEventDto, userId);
    }
    findAll(queryDto) {
        return this.communityEventsService.findAll(queryDto);
    }
    getUpcomingEvents() {
        return this.communityEventsService.getUpcomingEvents();
    }
    findById(id) {
        return this.communityEventsService.findById(id);
    }
    update(id, updateCommunityEventDto) {
        return this.communityEventsService.update(id, updateCommunityEventDto);
    }
    remove(id) {
        return this.communityEventsService.remove(id);
    }
};
exports.CommunityEventsController = CommunityEventsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new community event' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Community event created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_community_event_dto_1.CreateCommunityEventDto, String]),
    __metadata("design:returntype", void 0)
], CommunityEventsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all community events with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Community events retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_community_events_dto_1.QueryCommunityEventsDto]),
    __metadata("design:returntype", void 0)
], CommunityEventsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all upcoming events' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Upcoming events retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CommunityEventsController.prototype, "getUpcomingEvents", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get community event by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Community event retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Community event not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommunityEventsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Update community event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Community event updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Community event not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_community_event_dto_1.UpdateCommunityEventDto]),
    __metadata("design:returntype", void 0)
], CommunityEventsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete community event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Community event deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Community event not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommunityEventsController.prototype, "remove", null);
exports.CommunityEventsController = CommunityEventsController = __decorate([
    (0, swagger_1.ApiTags)('Community Events'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('community-events'),
    __metadata("design:paramtypes", [community_events_service_1.CommunityEventsService])
], CommunityEventsController);
//# sourceMappingURL=community-events.controller.js.map