"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEmployeeSalaryHeaderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_employee_salary_header_dto_1 = require("./create-employee-salary-header.dto");
class UpdateEmployeeSalaryHeaderDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_employee_salary_header_dto_1.CreateEmployeeSalaryHeaderDto, ['payrollNumber', 'employeeId'])) {
}
exports.UpdateEmployeeSalaryHeaderDto = UpdateEmployeeSalaryHeaderDto;
//# sourceMappingURL=update-employee-salary-header.dto.js.map