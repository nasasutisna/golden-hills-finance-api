export declare enum RequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum RequestPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class CreateInventoryRequestDto {
    requestNumber: string;
    inventoryId: string;
    requestedQuantity: number;
    requestDate: string;
    requiredDate?: string;
    purpose?: string;
    department?: string;
    priority?: RequestPriority;
    status?: RequestStatus;
    notes?: string;
}
