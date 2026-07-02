export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    PAID = "PAID",
    PARTIAL = "PARTIAL",
    OVERDUE = "OVERDUE",
    CANCELLED = "CANCELLED"
}
export declare class CreateResidentInvoiceDto {
    residentId: string;
    feeTypeId: string;
    invoiceDate: string;
    dueDate: string;
    periodStartDate: string;
    periodEndDate: string;
    subtotal: number;
    taxAmount?: number;
    discountAmount?: number;
    notes?: string;
    createdBy: string;
}
