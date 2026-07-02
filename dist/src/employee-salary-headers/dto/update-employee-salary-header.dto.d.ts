import { CreateEmployeeSalaryHeaderDto } from './create-employee-salary-header.dto';
declare const UpdateEmployeeSalaryHeaderDto_base: import("@nestjs/common").Type<Partial<Omit<CreateEmployeeSalaryHeaderDto, "payrollNumber" | "employeeId">>>;
export declare class UpdateEmployeeSalaryHeaderDto extends UpdateEmployeeSalaryHeaderDto_base {
}
export {};
