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
exports.WithdrawRequestSchema = exports.WithdrawRequest = exports.WithdrawRequestStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const swagger_1 = require("@nestjs/swagger");
const mongoose_2 = require("mongoose");
var WithdrawRequestStatus;
(function (WithdrawRequestStatus) {
    WithdrawRequestStatus["PENDING"] = "pending";
    WithdrawRequestStatus["APPROVED"] = "approved";
    WithdrawRequestStatus["PAID"] = "paid";
    WithdrawRequestStatus["REJECTED"] = "rejected";
})(WithdrawRequestStatus || (exports.WithdrawRequestStatus = WithdrawRequestStatus = {}));
let WithdrawRequest = class WithdrawRequest {
};
exports.WithdrawRequest = WithdrawRequest;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawRequest.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawRequest.prototype, "requestedByUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], WithdrawRequest.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WithdrawRequest.prototype, "chargePercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WithdrawRequest.prototype, "chargeBaseAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WithdrawRequest.prototype, "chargeGstPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WithdrawRequest.prototype, "chargeGstAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WithdrawRequest.prototype, "chargeAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WithdrawRequest.prototype, "netAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'WithdrawBankDetail', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawRequest.prototype, "bankDetailId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "accountHolderName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "ifscCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: WithdrawRequestStatus, default: WithdrawRequestStatus.PENDING }),
    (0, mongoose_1.Prop)({
        enum: WithdrawRequestStatus,
        default: WithdrawRequestStatus.PENDING,
    }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawRequest.prototype, "approvedByUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], WithdrawRequest.prototype, "approvedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "approvalNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawRequest.prototype, "paidByUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], WithdrawRequest.prototype, "paidAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "paymentReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "paymentNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "paymentProofUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], WithdrawRequest.prototype, "paymentProofName", void 0);
exports.WithdrawRequest = WithdrawRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WithdrawRequest);
exports.WithdrawRequestSchema = mongoose_1.SchemaFactory.createForClass(WithdrawRequest);
//# sourceMappingURL=withdraw-request.schema.js.map