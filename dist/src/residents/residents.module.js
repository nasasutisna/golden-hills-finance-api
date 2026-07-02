"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentsModule = void 0;
const common_1 = require("@nestjs/common");
const residents_controller_1 = require("./residents.controller");
const residents_service_1 = require("./residents.service");
const residents_repository_1 = require("./residents.repository");
const prisma_module_1 = require("../prisma/prisma.module");
const house_blocks_module_1 = require("../house-blocks/house-blocks.module");
let ResidentsModule = class ResidentsModule {
};
exports.ResidentsModule = ResidentsModule;
exports.ResidentsModule = ResidentsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, house_blocks_module_1.HouseBlocksModule],
        controllers: [residents_controller_1.ResidentsController],
        providers: [residents_service_1.ResidentsService, residents_repository_1.ResidentsRepository],
        exports: [residents_service_1.ResidentsService, residents_repository_1.ResidentsRepository],
    })
], ResidentsModule);
//# sourceMappingURL=residents.module.js.map