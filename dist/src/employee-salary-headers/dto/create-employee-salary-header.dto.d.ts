export declare enum PayrollStatus {
    DRAFT = "DRAFT",
    CALCULATED = "CALCULATED",
    APPROVED = "APPROVED",
    PAID = "PAID",
    CANCELLED = "CANCELLED"
}
export declare class CreateEmployeeSalaryHeaderDto {
    payrollNumber: string;
    employeeId: string;
    payPeriod: string;
    paymentDate?: string;
    basicSalary?: number;
    totalAllowances?: number;
    totalDeductions?: number;
    netSalary?: number;
    status?: PayrollStatus;
    workDays?: number;
    daysWorked?: number;
    overtimeHours?: number;
    leaveDays?: number;
    locked?: boolean;
    notes?: string;
}
