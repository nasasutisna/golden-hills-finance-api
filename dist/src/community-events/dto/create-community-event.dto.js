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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCommunityEventDto = exports.EventType = exports.EventStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var EventStatus;
(function (EventStatus) {
    EventStatus["DRAFT"] = "DRAFT";
    EventStatus["PUBLISHED"] = "PUBLISHED";
    EventStatus["ONGOING"] = "ONGOING";
    EventStatus["COMPLETED"] = "COMPLETED";
    EventStatus["CANCELLED"] = "CANCELLED";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var EventType;
(function (EventType) {
    EventType["MEETING"] = "MEETING";
    EventType["CELEBRATION"] = "CELEBRATION";
    EventType["MAINTENANCE"] = "MAINTENANCE";
    EventType["ACTIVITY"] = "ACTIVITY";
    EventType["ANNOUNCEMENT"] = "ANNOUNCEMENT";
    EventType["OTHER"] = "OTHER";
})(EventType || (exports.EventType = EventType = {}));
class CreateCommunityEventDto {
    constructor() {
        this.status = EventStatus.DRAFT;
        this.registrationRequired = true;
    }
}
exports.CreateCommunityEventDto = CreateCommunityEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Event title',
        example: 'Annual General Meeting',
        maxLength: 200,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Event title is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Event description',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Event type',
        enum: EventType,
        example: EventType.MEETING,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Event type is required' }),
    (0, class_validator_1.IsEnum)(EventType, { message: 'Invalid event type' }),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Event start date and time',
        example: '2024-02-15T09:00:00Z',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Event start date is required' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "eventStartDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Event end date and time',
        example: '2024-02-15T11:00:00Z',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "eventEndDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Location',
        maxLength: 200,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Expected participants',
        example: 50,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCommunityEventDto.prototype, "expectedParticipants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Budget',
        example: 5000000,
        minimum: 0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCommunityEventDto.prototype, "budget", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Event status',
        enum: EventStatus,
        default: EventStatus.DRAFT,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EventStatus, { message: 'Invalid event status' }),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is registration required',
        example: true,
        default: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCommunityEventDto.prototype, "registrationRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Registration deadline',
        example: '2024-02-10T23:59:59Z',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "registrationDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Organizer name',
        maxLength: 100,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "organizer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contact information',
        maxLength: 100,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "contact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional notes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCommunityEventDto.prototype, "notes", void 0);
//# sourceMappingURL=create-community-event.dto.js.map