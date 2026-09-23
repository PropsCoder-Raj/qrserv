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
exports.SubscriptionHistorySchema = exports.SubscriptionHistory = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let SubscriptionHistory = class SubscriptionHistory {
};
exports.SubscriptionHistory = SubscriptionHistory;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SubscriptionHistory.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Subscription', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SubscriptionHistory.prototype, "subscriptionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SubscriptionHistory.prototype, "planName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SubscriptionHistory.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SubscriptionHistory.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Extra trial days granted on first-ever purchase for an organization.',
        required: false,
        default: 0,
    }),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SubscriptionHistory.prototype, "trialDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Selected duration in months for this purchase. For legacy records this may be missing.',
        required: false,
        default: 1,
    }),
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], SubscriptionHistory.prototype, "months", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: () => new Date() }),
    __metadata("design:type", Date)
], SubscriptionHistory.prototype, "purchasedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], SubscriptionHistory.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SubscriptionHistory.prototype, "purchasedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
    }),
    __metadata("design:type", String)
], SubscriptionHistory.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], SubscriptionHistory.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], SubscriptionHistory.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['pending', 'paid', 'free'],
        default: 'free',
    }),
    __metadata("design:type", String)
], SubscriptionHistory.prototype, "paymentStatus", void 0);
exports.SubscriptionHistory = SubscriptionHistory = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], SubscriptionHistory);
exports.SubscriptionHistorySchema = mongoose_1.SchemaFactory.createForClass(SubscriptionHistory);
//# sourceMappingURL=subscription-history.schema.js.map