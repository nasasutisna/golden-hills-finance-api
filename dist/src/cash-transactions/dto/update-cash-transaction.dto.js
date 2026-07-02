"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCashTransactionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_cash_transaction_dto_1 = require("./create-cash-transaction.dto");
class UpdateCashTransactionDto extends (0, swagger_1.PartialType)(create_cash_transaction_dto_1.CreateCashTransactionDto) {
}
exports.UpdateCashTransactionDto = UpdateCashTransactionDto;
//# sourceMappingURL=update-cash-transaction.dto.js.map