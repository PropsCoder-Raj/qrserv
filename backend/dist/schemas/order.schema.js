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
exports.OrderSchema = exports.Order = exports.OrderItem = exports.SelectedSpiceLevel = exports.SelectedAddOn = exports.ManualDiscountType = exports.OrderItemStatus = exports.PaymentMethod = exports.PaymentStatus = exports.ORDER_STATUS_TRANSITIONS = exports.OrderStatus = void 0;
exports.canTransitionOrderStatus = canTransitionOrderStatus;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
const precision_1 = require("../common/utils/precision");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["READY"] = "ready";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
exports.ORDER_STATUS_TRANSITIONS = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
};
function canTransitionOrderStatus(from, to) {
    return exports.ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["ONLINE"] = "ONLINE";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var OrderItemStatus;
(function (OrderItemStatus) {
    OrderItemStatus["ACTIVE"] = "active";
    OrderItemStatus["CANCELLED"] = "cancelled";
})(OrderItemStatus || (exports.OrderItemStatus = OrderItemStatus = {}));
var ManualDiscountType;
(function (ManualDiscountType) {
    ManualDiscountType["PERCENTAGE"] = "PERCENTAGE";
    ManualDiscountType["FIXED"] = "FIXED";
})(ManualDiscountType || (exports.ManualDiscountType = ManualDiscountType = {}));
class SelectedAddOn {
}
exports.SelectedAddOn = SelectedAddOn;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SelectedAddOn.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SelectedAddOn.prototype, "emoji", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], SelectedAddOn.prototype, "priceDelta", void 0);
class SelectedSpiceLevel {
}
exports.SelectedSpiceLevel = SelectedSpiceLevel;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SelectedSpiceLevel.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SelectedSpiceLevel.prototype, "emoji", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], SelectedSpiceLevel.prototype, "priceDelta", void 0);
class OrderItem {
}
exports.OrderItem = OrderItem;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OrderItem.prototype, "menuItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderItem.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderItem.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderItem.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: OrderItemStatus }),
    __metadata("design:type", String)
], OrderItem.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 0 }),
    __metadata("design:type", Number)
], OrderItem.prototype, "cancelledQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], OrderItem.prototype, "cancelReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OrderItem.prototype, "cancelledBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Date)
], OrderItem.prototype, "cancelledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderItem.prototype, "itemType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Number)
], OrderItem.prototype, "gstRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Number)
], OrderItem.prototype, "vatRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: SelectedSpiceLevel }),
    __metadata("design:type", SelectedSpiceLevel)
], OrderItem.prototype, "spiceLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [SelectedAddOn] }),
    __metadata("design:type", Array)
], OrderItem.prototype, "addOns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], OrderItem.prototype, "specialInstructions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], OrderItem.prototype, "cookingNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], OrderItem.prototype, "instruction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], OrderItem.prototype, "notes", void 0);
let Order = class Order {
};
exports.Order = Order;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Order.prototype, "orderNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Restaurant', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "restaurantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Table', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "tableId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 'dine_in' }),
    __metadata("design:type", String)
], Order.prototype, "orderType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.ONLINE] }),
    (0, mongoose_1.Prop)({
        type: String,
        enum: [
            PaymentMethod.CASH,
            PaymentMethod.CARD,
            PaymentMethod.ONLINE,
            'cash',
            'card',
            'online',
        ],
        default: PaymentMethod.CASH,
        set: (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [OrderItem] }),
    (0, mongoose_1.Prop)({
        type: [
            {
                menuItemId: { type: mongoose_2.Schema.Types.ObjectId, ref: 'MenuItem' },
                name: String,
                price: { type: Number, set: precision_1.mongoose3DecimalSetter },
                quantity: Number,
                status: { type: String, default: OrderItemStatus.ACTIVE },
                cancelledQuantity: { type: Number, default: 0 },
                cancelReason: { type: String, default: '' },
                cancelledBy: { type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: false },
                cancelledAt: { type: Date, required: false },
                itemType: { type: String, default: 'food' },
                gstRate: { type: Number, set: precision_1.mongoose3DecimalSetter },
                vatRate: { type: Number, set: precision_1.mongoose3DecimalSetter },
                spiceLevel: {
                    type: {
                        name: String,
                        emoji: { type: String, default: '' },
                        priceDelta: { type: Number, default: 0, set: precision_1.mongoose3DecimalSetter },
                    },
                    required: false,
                    _id: false,
                },
                addOns: {
                    type: [
                        {
                            name: String,
                            emoji: { type: String, default: '' },
                            priceDelta: { type: Number, default: 0, set: precision_1.mongoose3DecimalSetter },
                            _id: false,
                        },
                    ],
                    default: [],
                },
                specialInstructions: { type: String, default: '' },
                cookingNote: { type: String, default: '' },
                instruction: { type: String, default: '' },
                notes: { type: String, default: '' },
            },
        ],
        required: true,
    }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "subtotalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "taxAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "taxRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "cgstRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "sgstRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "cgstAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "sgstAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 'exclusive' }),
    __metadata("design:type", String)
], Order.prototype, "taxType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "vatAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "vatRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 'exclusive' }),
    __metadata("design:type", String)
], Order.prototype, "vatType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "foodSubtotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "liquorSubtotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Taxable base of items taxed under the GST profile' }),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "gstBase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Taxable base of items taxed under the VAT profile' }),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "vatBase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'VAT collected grouped by rate and tax type' }),
    (0, mongoose_1.Prop)({
        type: [
            {
                rate: { type: Number, set: precision_1.mongoose3DecimalSetter },
                taxType: String,
                base: { type: Number, set: precision_1.mongoose3DecimalSetter },
                taxAmount: { type: Number, set: precision_1.mongoose3DecimalSetter },
                _id: false,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Order.prototype, "vatBreakdown", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'GST taxable base and tax grouped by item GST rate' }),
    (0, mongoose_1.Prop)({
        type: [
            {
                rate: { type: Number, set: precision_1.mongoose3DecimalSetter },
                taxType: String,
                base: { type: Number, set: precision_1.mongoose3DecimalSetter },
                taxAmount: { type: Number, set: precision_1.mongoose3DecimalSetter },
                _id: false,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Order.prototype, "gstBreakdown", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Per-line tax snapshot persisted when the order is completed' }),
    (0, mongoose_1.Prop)({
        type: [
            {
                menuItemId: { type: mongoose_2.Schema.Types.ObjectId, ref: 'MenuItem' },
                name: String,
                quantity: Number,
                grossAmount: { type: Number, set: precision_1.mongoose3DecimalSetter },
                gstRate: { type: Number, set: precision_1.mongoose3DecimalSetter },
                vatRate: { type: Number, set: precision_1.mongoose3DecimalSetter },
                taxableBase: { type: Number, set: precision_1.mongoose3DecimalSetter },
                cgstAmount: { type: Number, set: precision_1.mongoose3DecimalSetter },
                sgstAmount: { type: Number, set: precision_1.mongoose3DecimalSetter },
                gstAmount: { type: Number, set: precision_1.mongoose3DecimalSetter },
                vatAmount: { type: Number, set: precision_1.mongoose3DecimalSetter },
                taxAmount: { type: Number, set: precision_1.mongoose3DecimalSetter },
                lineTotal: { type: Number, set: precision_1.mongoose3DecimalSetter },
                _id: false,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Order.prototype, "lineTaxes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Order.prototype, "taxSnapshotAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Coupon', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "couponId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "couponCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 0 }),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "discountAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ManualDiscountType, required: false }),
    (0, mongoose_1.Prop)({ enum: ManualDiscountType, required: false, default: null }),
    __metadata("design:type", String)
], Order.prototype, "manualDiscountType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 0 }),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "manualDiscountValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 0 }),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "manualDiscountAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: '' }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Order.prototype, "manualDiscountReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ManualDiscountType, required: false }),
    (0, mongoose_1.Prop)({ enum: ManualDiscountType, required: false, default: null }),
    __metadata("design:type", String)
], Order.prototype, "manual_discount_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 0 }),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "manual_discount_value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 0 }),
    (0, mongoose_1.Prop)({ default: 0, type: Number, set: precision_1.mongoose3DecimalSetter }),
    __metadata("design:type", Number)
], Order.prototype, "manual_discount_amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: '' }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Order.prototype, "manual_discount_reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: OrderStatus }),
    (0, mongoose_1.Prop)({ enum: OrderStatus, default: OrderStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "customerPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PaymentStatus }),
    (0, mongoose_1.Prop)({ enum: PaymentStatus, default: PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether payment gateway payment is required for this order based on active subscription plan.',
        default: false,
    }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Order.prototype, "isPaymentGatewayAllocated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: '' }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Order.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: '' }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Order.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "paymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: '' }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Order.prototype, "order_instructions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: '' }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Order.prototype, "orderInstructions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: '' }),
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Order.prototype, "orderNotes", void 0);
exports.Order = Order = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Order);
exports.OrderSchema = mongoose_1.SchemaFactory.createForClass(Order);
exports.OrderSchema.pre('validate', function () {
    if (this.paymentMethod && typeof this.paymentMethod === 'string') {
        this.paymentMethod = this.paymentMethod.toUpperCase();
    }
    if (this.paymentStatus && typeof this.paymentStatus === 'string') {
        this.paymentStatus = this.paymentStatus.toLowerCase();
    }
    if (this.status && typeof this.status === 'string') {
        this.status = this.status.toLowerCase();
    }
});
//# sourceMappingURL=order.schema.js.map