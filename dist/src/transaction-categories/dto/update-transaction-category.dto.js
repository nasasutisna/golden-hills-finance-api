"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTransactionCategoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_transaction_category_dto_1 = require("./create-transaction-category.dto");
class UpdateTransactionCategoryDto extends (0, swagger_1.PartialType)(create_transaction_category_dto_1.CreateTransactionCategoryDto) {
}
exports.UpdateTransactionCategoryDto = UpdateTransactionCategoryDto;
//# sourceMappingURL=update-transaction-category.dto.js.map