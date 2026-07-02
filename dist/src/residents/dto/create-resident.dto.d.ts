export declare enum OwnershipType {
    OWNER = "OWNER",
    RENTER = "RENTER"
}
export declare enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER"
}
export declare enum MaritalStatus {
    SINGLE = "SINGLE",
    MARRIED = "MARRIED",
    DIVORCED = "DIVORCED",
    WIDOWED = "WIDOWED"
}
export declare class CreateResidentDto {
    residentCode: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    alternatePhone?: string;
    identityNumber?: string;
    dateOfBirth?: string;
    gender?: Gender;
    occupation?: string;
    maritalStatus?: MaritalStatus;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    houseBlockId: string;
    unitNumber: string;
    moveInDate?: string;
    moveOutDate?: string;
    ownershipType: OwnershipType;
    isActive?: boolean;
    notes?: string;
}
