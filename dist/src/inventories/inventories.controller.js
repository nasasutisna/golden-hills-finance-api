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
exports.InventoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventories_service_1 = require("./inventories.service");
const create_inventory_dto_1 = require("./dto/create-inventory.dto");
const update_inventory_dto_1 = require("./dto/update-inventory.dto");
const query_inventories_dto_1 = require("./dto/query-inventories.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let InventoriesController = class InventoriesController {
    constructor(inventoriesService) {
        this.inventoriesService = inventoriesService;
    }
    create(createInventoryDto) {
        return this.inventoriesService.create(createInventoryDto);
    }
    findAll(queryDto) {
        return this.inventoriesService.findAll(queryDto);
    }
    getLowStockItems() {
        return this.inventoriesService.getLowStockItems();
    }
    findById(id) {
        return this.inventoriesService.findById(id);
    }
    update(id, updateInventoryDto) {
        return this.inventoriesService.update(id, updateInventoryDto);
    }
    remove(id) {
        return this.inventoriesService.remove(id);
    }
};
exports.InventoriesController = InventoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Inventory item created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Item code already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inventory_dto_1.CreateInventoryDto]),
    __metadata("design:returntype", void 0)
], InventoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all inventory items with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory items retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_inventories_dto_1.QueryInventoriesDto]),
    __metadata("design:returntype", void 0)
], InventoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all items with low stock' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Low stock items retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoriesController.prototype, "getLowStockItems", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory item by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory item retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory item not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoriesController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Update inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory item updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory item not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inventory_dto_1.UpdateInventoryDto]),
    __metadata("design:returntype", void 0)
], InventoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory item deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory item not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoriesController.prototype, "remove", null);
exports.InventoriesController = InventoriesController = __decorate([
    (0, swagger_1.ApiTags)('Inventories'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('inventories'),
    __metadata("design:paramtypes", [inventories_service_1.InventoriesService])
], InventoriesController);
//# sourceMappingURL=inventories.controller.js.map