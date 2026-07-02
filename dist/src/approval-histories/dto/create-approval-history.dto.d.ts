export declare enum ApprovalAction {
    CREATED = "CREATED",
    SUBMITTED = "SUBMITTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
export declare class CreateApprovalHistoryDto {
    entityType: string;
    entityId: string;
    action: ApprovalAction;
    fromStatus?: string;
    toStatus: string;
    comments?: string;
    createdBy: string;
    approvedBy?: string;
    ipAddress?: string;
    userAgent?: string;
}
