"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWithdrawBankDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const withdraw_bank_detail_schema_1 = require("../../../schemas/withdraw-bank-detail.schema");
class CreateWithdrawBankDetailDto {
}
exports.CreateWithdrawBankDetailDto = CreateWithdrawBankDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: withdraw_bank_detail_schema_1.WithdrawBankDetailType,
        example: withdraw_bank_detail_schema_1.WithdrawBankDetailType.PERSONAL,
    }),
    (0, class_validator_1.IsEnum)(withdraw_bank_detail_schema_1.WithdrawBankDetailType),
    __metadata("design:type", String)
], CreateWithdrawBankDetailDto.prototype, "bankDetailType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Personal Account' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CreateWithdrawBankDetailDto.prototype, "customBankDetailLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Acme Foods Pvt Ltd' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateWithdrawBankDetailDto.prototype, "accountHolderName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'State Bank of India' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateWithdrawBankDetailDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456789012' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateWithdrawBankDetailDto.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SBIN0001234' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateWithdrawBankDetailDto.prototype, "ifscCode", void 0);
//# sourceMappingURL=create-withdraw-bank-detail.dto.js.map