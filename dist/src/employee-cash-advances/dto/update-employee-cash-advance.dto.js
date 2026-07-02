"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEmployeeCashAdvanceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_employee_cash_advance_dto_1 = require("./create-employee-cash-advance.dto");
class UpdateEmployeeCashAdvanceDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_employee_cash_advance_dto_1.CreateEmployeeCashAdvanceDto, ['advanceNumber', 'employeeId'])) {
}
exports.UpdateEmployeeCashAdvanceDto = UpdateEmployeeCashAdvanceDto;
//# sourceMappingURL=update-employee-cash-advance.dto.js.map