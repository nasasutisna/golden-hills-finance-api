export declare enum CategoryType {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}
export declare class CreateTransactionCategoryDto {
    categoryCode: string;
    categoryName: string;
    description?: string;
    categoryType: CategoryType;
    parentCategoryId?: string;
    budgetCode?: string;
    isActive?: boolean;
}
