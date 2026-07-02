export declare enum InventoryItemType {
    CONSUMABLE = "CONSUMABLE",
    FIXED_ASSET = "FIXED_ASSET",
    EQUIPMENT = "EQUIPMENT",
    OFFICE_SUPPLIES = "OFFICE_SUPPLIES",
    MAINTENANCE = "MAINTENANCE",
    OTHER = "OTHER"
}
export declare enum InventoryUnit {
    PCS = "PCS",
    BOX = "BOX",
    UNIT = "UNIT",
    KG = "KG",
    LITER = "LITER",
    METER = "METER",
    PACK = "PACK",
    SET = "SET"
}
export declare class CreateInventoryDto {
    itemCode: string;
    itemName: string;
    description?: string;
    itemType: InventoryItemType;
    unit: InventoryUnit;
    currentStock: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderQuantity?: number;
    unitCost?: number;
    location?: string;
    supplier?: string;
    supplierContact?: string;
    notes?: string;
}
