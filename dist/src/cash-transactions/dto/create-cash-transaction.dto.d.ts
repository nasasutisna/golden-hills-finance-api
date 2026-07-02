export declare enum TransactionType {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}
export declare enum ApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class CreateCashTransactionDto {
    transactionDate: string;
    transactionType: TransactionType;
    categoryId: string;
    amount: number;
    paymentMethod: string;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    description: string;
    notes?: string;
    requiresApproval?: boolean;
    ipAddress?: string;
    userAgent?: string;
}
