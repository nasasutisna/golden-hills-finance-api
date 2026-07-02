export declare enum FeeCategory {
    MAINTENANCE = "MAINTENANCE",
    UTILITIES = "UTILITIES",
    SECURITY = "SECURITY",
    OTHERS = "OTHERS"
}
export declare enum RecurringPeriod {
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    YEARLY = "YEARLY"
}
export declare class CreateFeeTypeDto {
    feeCode: string;
    feeName: string;
    description?: string;
    feeCategory: FeeCategory;
    isRecurring?: boolean;
    recurringPeriod?: RecurringPeriod;
    isTaxable?: boolean;
    taxRate?: number;
    defaultAmount?: number;
    isActive?: boolean;
}
