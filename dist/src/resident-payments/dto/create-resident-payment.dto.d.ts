export declare enum PaymentMethod {
    CASH = "CASH",
    TRANSFER = "TRANSFER",
    CARD = "CARD",
    E_WALLET = "E_WALLET"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare class CreateResidentPaymentDto {
    residentId: string;
    invoiceId: string;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    paymentChannel?: string;
    referenceNumber?: string;
    amount: number;
    bankName?: string;
    accountNumber?: string;
    notes?: string;
}
