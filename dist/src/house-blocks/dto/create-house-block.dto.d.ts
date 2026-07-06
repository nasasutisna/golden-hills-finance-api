export declare enum BlockType {
    RESIDENTIAL = "RESIDENTIAL",
    COMMERCIAL = "COMMERCIAL",
    MIXED = "MIXED"
}
export declare class CreateHouseBlockDto {
    blockCode: string;
    blockName: string;
    blockType: BlockType;
    address?: string;
    totalUnits: number;
    totalFloors?: number;
    constructionYear?: number;
    landArea?: number;
    buildingArea?: number;
    facilities?: string;
    amenities?: string;
    isActive?: boolean;
    description?: string;
    coordinatorId?: string;
}
