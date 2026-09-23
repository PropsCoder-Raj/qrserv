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
exports.RestaurantSchema = exports.Restaurant = exports.TaxType = exports.RestaurantType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
var RestaurantType;
(function (RestaurantType) {
    RestaurantType["SMALL_CART_STALL"] = "small cart stall";
    RestaurantType["DINING"] = "dining";
    RestaurantType["KITCHEN"] = "kitchen";
})(RestaurantType || (exports.RestaurantType = RestaurantType = {}));
var TaxType;
(function (TaxType) {
    TaxType["INCLUSIVE"] = "inclusive";
    TaxType["EXCLUSIVE"] = "exclusive";
})(TaxType || (exports.TaxType = TaxType = {}));
let Restaurant = class Restaurant {
};
exports.Restaurant = Restaurant;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "owner_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: RestaurantType }),
    (0, mongoose_1.Prop)({
        required: true,
        enum: RestaurantType,
        default: RestaurantType.DINING,
    }),
    __metadata("design:type", String)
], Restaurant.prototype, "restaurant_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Restaurant.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Restaurant.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Restaurant.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Restaurant.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Restaurant.prototype, "gst_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Restaurant.prototype, "vat_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Restaurant.prototype, "taxEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Restaurant.prototype, "taxRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TaxType }),
    (0, mongoose_1.Prop)({ enum: TaxType, default: TaxType.INCLUSIVE }),
    __metadata("design:type", String)
], Restaurant.prototype, "taxType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Restaurant.prototype, "vatEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Restaurant.prototype, "vatRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TaxType }),
    (0, mongoose_1.Prop)({ enum: TaxType, default: TaxType.INCLUSIVE }),
    __metadata("design:type", String)
], Restaurant.prototype, "vatType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Restaurant.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Restaurant.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Restaurant.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Restaurant.prototype, "menuPdf", void 0);
exports.Restaurant = Restaurant = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Restaurant);
exports.RestaurantSchema = mongoose_1.SchemaFactory.createForClass(Restaurant);
//# sourceMappingURL=restaurant.schema.js.map