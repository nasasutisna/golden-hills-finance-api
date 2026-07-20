export declare enum EmploymentStatus {
    ACTIVE = "ACTIVE",
    PROBATION = "PROBATION",
    RESIGNED = "RESIGNED",
    TERMINATED = "TERMINATED"
}
export declare class CreateEmployeeDto {
    employeeCode?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    alternatePhone?: string;
    identityNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    maritalStatus?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    positionId: string;
    hireDate: string;
    probationEndDate?: string;
    employmentStatus: EmploymentStatus;
    basicSalary?: number;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
    taxId?: string;
    photo?: string;
    notes?: string;
    isActive?: boolean;
}
