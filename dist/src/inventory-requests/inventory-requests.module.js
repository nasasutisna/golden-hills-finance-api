"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const inventory_requests_controller_1 = require("./inventory-requests.controller");
const inventory_requests_service_1 = require("./inventory-requests.service");
const inventory_requests_repository_1 = require("./inventory-requests.repository");
let InventoryRequestsModule = class InventoryRequestsModule {
};
exports.InventoryRequestsModule = InventoryRequestsModule;
exports.InventoryRequestsModule = InventoryRequestsModule = __decorate([
    (0, common_1.Module)({
        controllers: [inventory_requests_controller_1.InventoryRequestsController],
        providers: [inventory_requests_service_1.InventoryRequestsService, inventory_requests_repository_1.InventoryRequestsRepository],
        exports: [inventory_requests_service_1.InventoryRequestsService, inventory_requests_repository_1.InventoryRequestsRepository],
    })
], InventoryRequestsModule);
//# sourceMappingURL=inventory-requests.module.js.map