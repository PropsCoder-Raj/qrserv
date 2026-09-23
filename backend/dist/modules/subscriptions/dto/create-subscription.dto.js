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
exports.CreateSubscriptionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SubscriptionOfferDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, description: 'Offer applies for X months' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SubscriptionOfferDto.prototype, "months", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50, description: 'Percentage discount (0-100)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SubscriptionOfferDto.prototype, "offerPercent", void 0);
class CreateSubscriptionDto {
}
exports.CreateSubscriptionDto = CreateSubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Basic Plan' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 999 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'none',
        enum: ['none', 'flat', 'percentage'],
        description: 'Discount type to apply on price',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['none', 'flat', 'percentage']),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "discountType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 10,
        description: 'Discount value. When discountType=flat => ₹ amount. When percentage => 0-100.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "discountValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'Whether this plan should use payment gateway based purchase flow.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSubscriptionDto.prototype, "isPaymentGatewayAllocated", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'Whether this plan should allow restaurant menu PDF upload and PDF QR usage.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSubscriptionDto.prototype, "isMenuPdfEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30, description: 'Duration in days' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "maxTables", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50, description: '0 = unlimited' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "maxMenuItems", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: '0 = unlimited' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "maxCategories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, description: '0 = unlimited' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "maxRestaurants", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'none',
        enum: ['none', 'optional', 'included'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['none', 'optional', 'included']),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "customerDataAccess", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['QR Codes', 'Order Management'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSubscriptionDto.prototype, "features", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [SubscriptionOfferDto],
        description: 'Month-based offers. Example: [{months:3, offerPercent:50},{months:5, offerPercent:70}]',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SubscriptionOfferDto),
    __metadata("design:type", Array)
], CreateSubscriptionDto.prototype, "offers", void 0);
//# sourceMappingURL=create-subscription.dto.js.map