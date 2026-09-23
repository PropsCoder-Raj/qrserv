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
exports.OrganizationSchema = exports.Organization = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let Organization = class Organization {
};
exports.Organization = Organization;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Organization.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Organization.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Organization.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Organization.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Organization.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Organization.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Organization.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Subscription', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Organization.prototype, "subscriptionPlan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether auto-pay is enabled for the current active subscription. When enabled, the system may auto-renew the subscription in the future (implementation-dependent).',
        required: false,
        default: false,
    }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Organization.prototype, "subscriptionAutoPayEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Razorpay subscription id when auto-pay is enabled. Used to cancel/track recurring payments.',
        required: false,
        default: '',
    }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Organization.prototype, "subscriptionRazorpaySubscriptionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Razorpay customer id for the organization (optional, created on-demand for subscriptions).',
        required: false,
        default: '',
    }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Organization.prototype, "subscriptionRazorpayCustomerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Organization.prototype, "subscriptionExpiry", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Organization.prototype, "isActive", void 0);
exports.Organization = Organization = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Organization);
exports.OrganizationSchema = mongoose_1.SchemaFactory.createForClass(Organization);
//# sourceMappingURL=organization.schema.js.map