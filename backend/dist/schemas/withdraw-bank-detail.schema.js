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
exports.WithdrawBankDetailSchema = exports.WithdrawBankDetail = exports.WithdrawBankDetailType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const swagger_1 = require("@nestjs/swagger");
const mongoose_2 = require("mongoose");
var WithdrawBankDetailType;
(function (WithdrawBankDetailType) {
    WithdrawBankDetailType["PERSONAL"] = "personal";
    WithdrawBankDetailType["OTHER"] = "other";
})(WithdrawBankDetailType || (exports.WithdrawBankDetailType = WithdrawBankDetailType = {}));
let WithdrawBankDetail = class WithdrawBankDetail {
};
exports.WithdrawBankDetail = WithdrawBankDetail;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawBankDetail.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawBankDetail.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: WithdrawBankDetailType, default: WithdrawBankDetailType.PERSONAL }),
    (0, mongoose_1.Prop)({
        enum: WithdrawBankDetailType,
        default: WithdrawBankDetailType.PERSONAL,
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], WithdrawBankDetail.prototype, "bankDetailType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], WithdrawBankDetail.prototype, "customBankDetailLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], WithdrawBankDetail.prototype, "accountHolderName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], WithdrawBankDetail.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], WithdrawBankDetail.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], WithdrawBankDetail.prototype, "ifscCode", void 0);
exports.WithdrawBankDetail = WithdrawBankDetail = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WithdrawBankDetail);
exports.WithdrawBankDetailSchema = mongoose_1.SchemaFactory.createForClass(WithdrawBankDetail);
exports.WithdrawBankDetailSchema.index({ organizationId: 1, userId: 1, accountNumber: 1, ifscCode: 1 }, { unique: true });
//# sourceMappingURL=withdraw-bank-detail.schema.js.map