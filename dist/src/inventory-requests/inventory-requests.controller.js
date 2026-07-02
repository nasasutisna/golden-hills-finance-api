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
exports.InventoryRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_requests_service_1 = require("./inventory-requests.service");
const create_inventory_request_dto_1 = require("./dto/create-inventory-request.dto");
const update_inventory_request_dto_1 = require("./dto/update-inventory-request.dto");
const query_inventory_requests_dto_1 = require("./dto/query-inventory-requests.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let InventoryRequestsController = class InventoryRequestsController {
    constructor(inventoryRequestsService) {
        this.inventoryRequestsService = inventoryRequestsService;
    }
    create(createInventoryRequestDto, userId) {
        return this.inventoryRequestsService.create(createInventoryRequestDto, userId);
    }
    findAll(queryDto) {
        return this.inventoryRequestsService.findAll(queryDto);
    }
    findByStatus(status) {
        return this.inventoryRequestsService.findByStatus(status);
    }
    findById(id) {
        return this.inventoryRequestsService.findById(id);
    }
    update(id, updateInventoryRequestDto) {
        return this.inventoryRequestsService.update(id, updateInventoryRequestDto);
    }
    approveRequest(id, approverId, notes) {
        return this.inventoryRequestsService.approveRequest(id, approverId, notes);
    }
    rejectRequest(id, approverId, notes) {
        return this.inventoryRequestsService.rejectRequest(id, approverId, notes);
    }
    completeRequest(id) {
        return this.inventoryRequestsService.completeRequest(id);
    }
    remove(id) {
        return this.inventoryRequestsService.remove(id);
    }
};
exports.InventoryRequestsController = InventoryRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new inventory request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Inventory request created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Request number already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inventory_request_dto_1.CreateInventoryRequestDto, String]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all inventory requests with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory requests retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_inventory_requests_dto_1.QueryInventoryRequestsDto]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('status/:status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get requests by status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Requests retrieved successfully' }),
    __param(0, (0, common_1.Param)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "findByStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory request by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory request retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory request not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Update inventory request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory request updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory request not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inventory_request_dto_1.UpdateInventoryRequestDto]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve inventory request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory request approved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory request not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot approve request with current status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "approveRequest", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject inventory request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory request rejected successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory request not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot reject request with current status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete inventory request and update stock' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory request completed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory request not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cannot complete request with current status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "completeRequest", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete inventory request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory request deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory request not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "remove", null);
exports.InventoryRequestsController = InventoryRequestsController = __decorate([
    (0, swagger_1.ApiTags)('Inventory Requests'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('inventory-requests'),
    __metadata("design:paramtypes", [inventory_requests_service_1.InventoryRequestsService])
], InventoryRequestsController);
//# sourceMappingURL=inventory-requests.controller.js.map