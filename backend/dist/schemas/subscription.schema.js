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
exports.SubscriptionSchema = exports.Subscription = exports.SubscriptionOffer = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const swagger_1 = require("@nestjs/swagger");
class SubscriptionOffer {
}
exports.SubscriptionOffer = SubscriptionOffer;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, description: 'Offer applies for X months' }),
    __metadata("design:type", Number)
], SubscriptionOffer.prototype, "months", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 50,
        description: 'Percentage discount (0-100) applied on total amount',
    }),
    __metadata("design:type", Number)
], SubscriptionOffer.prototype, "offerPercent", void 0);
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Subscription.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Subscription.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['none', 'flat', 'percentage'], default: 'none' }),
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['none', 'flat', 'percentage'],
        default: 'none',
    }),
    __metadata("design:type", String)
], Subscription.prototype, "discountType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Flat amount (₹) or percentage (%) based on discountType',
        default: 0,
    }),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Subscription.prototype, "discountValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether this subscription plan requires payment gateway based purchase flow',
        default: false,
    }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "isPaymentGatewayAllocated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether this subscription plan allows restaurant menu PDF uploads and PDF QR access.',
        default: false,
    }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "isMenuPdfEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Subscription.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Razorpay Plan id used for recurring subscription auto-pay (monthly). This is created on-demand when auto-pay is enabled.',
        required: false,
        default: '',
    }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Subscription.prototype, "razorpayPlanId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 10 }),
    __metadata("design:type", Number)
], Subscription.prototype, "maxTables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 50 }),
    __metadata("design:type", Number)
], Subscription.prototype, "maxMenuItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Subscription.prototype, "maxCategories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 5 }),
    __metadata("design:type", Number)
], Subscription.prototype, "maxRestaurants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['none', 'optional', 'included'],
        default: 'none',
    }),
    __metadata("design:type", String)
], Subscription.prototype, "customerDataAccess", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Subscription.prototype, "features", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        type: [SubscriptionOffer],
        description: 'Month-based offers. Example: {months: 3, offerPercent: 50} => 50% off for 3-month purchase.',
    }),
    (0, mongoose_1.Prop)({
        type: [
            {
                months: { type: Number, required: true },
                offerPercent: { type: Number, required: true },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Subscription.prototype, "offers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "isActive", void 0);
exports.Subscription = Subscription = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Subscription);
exports.SubscriptionSchema = mongoose_1.SchemaFactory.createForClass(Subscription);
//# sourceMappingURL=subscription.schema.js.map