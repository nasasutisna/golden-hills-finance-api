export declare enum EventStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ONGOING = "ONGOING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum EventType {
    MEETING = "MEETING",
    CELEBRATION = "CELEBRATION",
    MAINTENANCE = "MAINTENANCE",
    ACTIVITY = "ACTIVITY",
    ANNOUNCEMENT = "ANNOUNCEMENT",
    OTHER = "OTHER"
}
export declare class CreateCommunityEventDto {
    title: string;
    description?: string;
    eventType: EventType;
    eventStartDate: string;
    eventEndDate?: string;
    location?: string;
    expectedParticipants?: number;
    budget?: number;
    status?: EventStatus;
    registrationRequired?: boolean;
    registrationDeadline?: string;
    organizer?: string;
    contact?: string;
    notes?: string;
}
