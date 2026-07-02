export declare enum AdvanceStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    DISBURSED = "DISBURSED",
    REPAID = "REPAID",
    PARTIALLY_REPAID = "PARTIALLY_REPAID",
    CANCELLED = "CANCELLED"
}
export declare class CreateEmployeeCashAdvanceDto {
    advanceNumber: string;
    employeeId: string;
    requestDate: string;
    amount: number;
    purpose: string;
    expectedRepaymentDate?: string;
    installmentCount?: number;
    status?: AdvanceStatus;
    notes?: string;
}
