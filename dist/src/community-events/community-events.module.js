"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityEventsModule = void 0;
const common_1 = require("@nestjs/common");
const community_events_controller_1 = require("./community-events.controller");
const community_events_service_1 = require("./community-events.service");
const community_events_repository_1 = require("./community-events.repository");
let CommunityEventsModule = class CommunityEventsModule {
};
exports.CommunityEventsModule = CommunityEventsModule;
exports.CommunityEventsModule = CommunityEventsModule = __decorate([
    (0, common_1.Module)({
        controllers: [community_events_controller_1.CommunityEventsController],
        providers: [community_events_service_1.CommunityEventsService, community_events_repository_1.CommunityEventsRepository],
        exports: [community_events_service_1.CommunityEventsService, community_events_repository_1.CommunityEventsRepository],
    })
], CommunityEventsModule);
//# sourceMappingURL=community-events.module.js.map