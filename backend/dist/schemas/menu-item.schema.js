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
exports.MenuItemSchema = exports.MenuItem = exports.MenuItemCustomizationSchema = exports.MenuItemCustomization = exports.CustomizationOptionSchema = exports.CustomizationOption = exports.PriceDropType = exports.ItemType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
const precision_1 = require("../common/utils/precision");
var ItemType;
(function (ItemType) {
    ItemType["FOOD"] = "food";
    ItemType["LIQUOR"] = "liquor";
})(ItemType || (exports.ItemType = ItemType = {}));
var PriceDropType;
(function (PriceDropType) {
    PriceDropType["PERCENTAGE"] = "percentage";
    PriceDropType["FIXED"] = "fixed";
})(PriceDropType || (exports.PriceDropType = PriceDropType = {}));
let CustomizationOption = class CustomizationOption {
};
exports.CustomizationOption = CustomizationOption;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CustomizationOption.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], CustomizationOption.prototype, "emoji", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], CustomizationOption.prototype, "priceDelta", void 0);
exports.CustomizationOption = CustomizationOption = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CustomizationOption);
exports.CustomizationOptionSchema = mongoose_1.SchemaFactory.createForClass(CustomizationOption);
let MenuItemCustomization = class MenuItemCustomization {
};
exports.MenuItemCustomization = MenuItemCustomization;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CustomizationOption] }),
    (0, mongoose_1.Prop)({ type: [exports.CustomizationOptionSchema], default: [] }),
    __metadata("design:type", Array)
], MenuItemCustomization.prototype, "spiceLevels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CustomizationOption] }),
    (0, mongoose_1.Prop)({ type: [exports.CustomizationOptionSchema], default: [] }),
    __metadata("design:type", Array)
], MenuItemCustomization.prototype, "addOns", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], MenuItemCustomization.prototype, "allowSpecialInstructions", void 0);
exports.MenuItemCustomization = MenuItemCustomization = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], MenuItemCustomization);
exports.MenuItemCustomizationSchema = mongoose_1.SchemaFactory.createForClass(MenuItemCustomization);
let MenuItem = class MenuItem {
};
exports.MenuItem = MenuItem;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MenuItem.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MenuItem.prototype, "ingredients", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], MenuItem.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: PriceDropType }),
    (0, mongoose_1.Prop)({ enum: PriceDropType }),
    __metadata("design:type", String)
], MenuItem.prototype, "discountType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, mongoose_1.Prop)({ min: 0, default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], MenuItem.prototype, "discountValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MenuItem.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Category', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MenuItem.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Restaurant', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MenuItem.prototype, "restaurantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], MenuItem.prototype, "isVeg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], MenuItem.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 15 }),
    __metadata("design:type", Number)
], MenuItem.prototype, "preparationTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ItemType }),
    (0, mongoose_1.Prop)({ enum: ItemType, default: ItemType.FOOD }),
    __metadata("design:type", String)
], MenuItem.prototype, "itemType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0, description: 'GST % applied to this item. 0 means no GST' }),
    (0, mongoose_1.Prop)({ min: 0, default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], MenuItem.prototype, "gstRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0, description: 'VAT % applied to this item. 0 means no VAT' }),
    (0, mongoose_1.Prop)({ min: 0, default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], MenuItem.prototype, "vatRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: MenuItemCustomization }),
    (0, mongoose_1.Prop)({ type: exports.MenuItemCustomizationSchema, default: () => ({}) }),
    __metadata("design:type", MenuItemCustomization)
], MenuItem.prototype, "customization", void 0);
exports.MenuItem = MenuItem = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MenuItem);
exports.MenuItemSchema = mongoose_1.SchemaFactory.createForClass(MenuItem);
//# sourceMappingURL=menu-item.schema.js.map