"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseBlocksModule = void 0;
const common_1 = require("@nestjs/common");
const house_blocks_controller_1 = require("./house-blocks.controller");
const house_blocks_service_1 = require("./house-blocks.service");
const house_blocks_repository_1 = require("./house-blocks.repository");
const prisma_module_1 = require("../prisma/prisma.module");
let HouseBlocksModule = class HouseBlocksModule {
};
exports.HouseBlocksModule = HouseBlocksModule;
exports.HouseBlocksModule = HouseBlocksModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [house_blocks_controller_1.HouseBlocksController],
        providers: [house_blocks_service_1.HouseBlocksService, house_blocks_repository_1.HouseBlocksRepository],
        exports: [house_blocks_service_1.HouseBlocksService, house_blocks_repository_1.HouseBlocksRepository],
    })
], HouseBlocksModule);
//# sourceMappingURL=house-blocks.module.js.map