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
exports.VerifySubscriptionPaymentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class VerifySubscriptionPaymentDto {
}
exports.VerifySubscriptionPaymentDto = VerifySubscriptionPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the subscription plan' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifySubscriptionPaymentDto.prototype, "subscriptionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Selected duration in months for the purchase. Defaults to 1 if omitted.',
        required: false,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], VerifySubscriptionPaymentDto.prototype, "months", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Razorpay order ID' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifySubscriptionPaymentDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Razorpay payment ID' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifySubscriptionPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Razorpay signature for verification' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifySubscriptionPaymentDto.prototype, "razorpaySignature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Enable auto-pay for subscription renewal (if supported).',
        required: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], VerifySubscriptionPaymentDto.prototype, "autoPay", void 0);
//# sourceMappingURL=verify-subscription-payment.dto.js.map