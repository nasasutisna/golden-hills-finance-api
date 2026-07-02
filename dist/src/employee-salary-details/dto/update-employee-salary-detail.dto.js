"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEmployeeSalaryDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_employee_salary_detail_dto_1 = require("./create-employee-salary-detail.dto");
class UpdateEmployeeSalaryDetailDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_employee_salary_detail_dto_1.CreateEmployeeSalaryDetailDto, ['salaryHeaderId'])) {
}
exports.UpdateEmployeeSalaryDetailDto = UpdateEmployeeSalaryDetailDto;
//# sourceMappingURL=update-employee-salary-detail.dto.js.map