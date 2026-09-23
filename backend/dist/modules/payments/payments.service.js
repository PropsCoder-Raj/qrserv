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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = require("crypto");
const payment_schema_1 = require("../../schemas/payment.schema");
const order_schema_1 = require("../../schemas/order.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const organization_schema_1 = require("../../schemas/organization.schema");
const subscription_schema_1 = require("../../schemas/subscription.schema");
let PaymentsService = class PaymentsService {
    constructor(paymentModel, orderModel, restaurantModel, organizationModel, subscriptionModel, configService) {
        this.paymentModel = paymentModel;
        this.orderModel = orderModel;
        this.restaurantModel = restaurantModel;
        this.organizationModel = organizationModel;
        this.subscriptionModel = subscriptionModel;
        this.configService = configService;
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
            key_id: this.configService.get('razorpay.keyId'),
            key_secret: this.configService.get('razorpay.keySecret'),
        });
    }
    async isPaymentGatewayAllocatedForOrder(order) {
        if (!order?.restaurantId)
            return false;
        const restaurant = await this.restaurantModel
            .findById(order.restaurantId)
            .select('organizationId')
            .lean();
        if (!restaurant?.organizationId)
            return false;
        const organization = await this.organizationModel
            .findById(restaurant.organizationId)
            .select('subscriptionPlan subscriptionExpiry')
            .lean();
        if (!organization?.subscriptionPlan)
            return false;
        if (organization.subscriptionExpiry &&
            new Date(organization.subscriptionExpiry) < new Date()) {
            return false;
        }
        const subscription = await this.subscriptionModel
            .findById(organization.subscriptionPlan)
            .select('isPaymentGatewayAllocated')
            .lean();
        return Boolean(subscription?.isPaymentGatewayAllocated);
    }
    async createOrderForOrder(order) {
        const razorpayOrder = await this.razorpay.orders.create({
            amount: Math.round(order.totalAmount * 100),
            currency: 'INR',
            receipt: order.orderNumber,
            notes: {
                orderId: order._id.toString(),
                restaurantId: order.restaurantId?.toString?.() || '',
            },
        });
        const payment = await this.paymentModel.create({
            orderId: order._id,
            restaurantId: order.restaurantId,
            razorpayOrderId: razorpayOrder.id,
            amount: order.totalAmount,
            currency: 'INR',
            status: payment_schema_1.PaymentSchemaStatus.CREATED,
        });
        await this.orderModel.findByIdAndUpdate(order._id, {
            paymentStatus: order_schema_1.PaymentStatus.PENDING,
            isPaymentGatewayAllocated: true,
            razorpayOrderId: razorpayOrder.id,
        });
        return {
            paymentId: payment._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: this.configService.get('razorpay.keyId'),
        };
    }
    async createOrder(dto) {
        const order = await this.orderModel.findById(dto.orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.paymentStatus === order_schema_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Order is already paid');
        }
        const isPaymentGatewayAllocated = await this.isPaymentGatewayAllocatedForOrder(order);
        if (!isPaymentGatewayAllocated) {
            throw new common_1.BadRequestException('Online payment is disabled for this restaurant subscription plan');
        }
        return this.createOrderForOrder(order);
    }
    async verifyPayment(dto) {
        const secret = this.configService.get('razorpay.keySecret');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
            .digest('hex');
        if (expectedSignature !== dto.razorpaySignature) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        const payment = await this.paymentModel.findOneAndUpdate({ razorpayOrderId: dto.razorpayOrderId }, {
            razorpayPaymentId: dto.razorpayPaymentId,
            razorpaySignature: dto.razorpaySignature,
            status: payment_schema_1.PaymentSchemaStatus.CAPTURED,
        }, { new: true });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        await this.orderModel.findByIdAndUpdate(payment.orderId, {
            paymentStatus: order_schema_1.PaymentStatus.PAID,
            paymentId: dto.razorpayPaymentId,
            razorpayPaymentId: dto.razorpayPaymentId,
        });
        return { message: 'Payment verified successfully', payment };
    }
    async handleWebhook(body) {
        const event = body.event;
        if (event === 'payment.captured') {
            const razorpayPaymentId = body.payload.payment.entity.id;
            const razorpayOrderId = body.payload.payment.entity.order_id;
            await this.paymentModel.findOneAndUpdate({ razorpayOrderId }, {
                razorpayPaymentId,
                status: payment_schema_1.PaymentSchemaStatus.CAPTURED,
            });
            const payment = await this.paymentModel.findOne({ razorpayOrderId });
            if (payment) {
                await this.orderModel.findByIdAndUpdate(payment.orderId, {
                    paymentStatus: order_schema_1.PaymentStatus.PAID,
                    paymentId: razorpayPaymentId,
                    razorpayPaymentId,
                });
            }
        }
        if (event === 'payment.failed') {
            const razorpayOrderId = body.payload.payment.entity.order_id;
            await this.paymentModel.findOneAndUpdate({ razorpayOrderId }, { status: payment_schema_1.PaymentSchemaStatus.FAILED });
            const payment = await this.paymentModel.findOne({ razorpayOrderId });
            if (payment) {
                await this.orderModel.findByIdAndUpdate(payment.orderId, {
                    paymentStatus: order_schema_1.PaymentStatus.FAILED,
                });
            }
        }
        return { status: 'ok' };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(2, (0, mongoose_1.InjectModel)(restaurant_schema_1.Restaurant.name)),
    __param(3, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __param(4, (0, mongoose_1.InjectModel)(subscription_schema_1.Subscription.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map