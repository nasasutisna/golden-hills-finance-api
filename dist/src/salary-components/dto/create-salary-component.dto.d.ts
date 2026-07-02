export declare enum ComponentType {
    BASIC = "BASIC",
    ALLOWANCE = "ALLOWANCE",
    DEDUCTION = "DEDUCTION",
    BONUS = "BONUS",
    OVERTIME = "OVERTIME",
    TAX = "TAX",
    INSURANCE = "INSURANCE",
    OTHER = "OTHER"
}
export declare enum CalculationType {
    FIXED = "FIXED",
    PERCENTAGE = "PERCENTAGE",
    FORMULA = "FORMULA"
}
export declare class CreateSalaryComponentDto {
    componentCode: string;
    componentName: string;
    description?: string;
    componentType: ComponentType;
    calculationType: CalculationType;
    defaultValue?: number;
    percentageValue?: number;
    formula?: string;
    isTaxSubject?: boolean;
    calculationOrder?: number;
    isActive?: boolean;
    accountCode?: string;
    notes?: string;
}
