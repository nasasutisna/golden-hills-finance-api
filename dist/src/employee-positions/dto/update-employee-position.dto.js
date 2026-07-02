"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEmployeePositionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_employee_position_dto_1 = require("./create-employee-position.dto");
class UpdateEmployeePositionDto extends (0, swagger_1.PartialType)(create_employee_position_dto_1.CreateEmployeePositionDto) {
}
exports.UpdateEmployeePositionDto = UpdateEmployeePositionDto;
//# sourceMappingURL=update-employee-position.dto.js.map