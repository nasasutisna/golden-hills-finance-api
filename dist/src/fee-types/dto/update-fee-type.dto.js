"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFeeTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_fee_type_dto_1 = require("./create-fee-type.dto");
class UpdateFeeTypeDto extends (0, swagger_1.PartialType)(create_fee_type_dto_1.CreateFeeTypeDto) {
}
exports.UpdateFeeTypeDto = UpdateFeeTypeDto;
//# sourceMappingURL=update-fee-type.dto.js.map