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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("../../schemas/order.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const organization_schema_1 = require("../../schemas/organization.schema");
const subscription_schema_1 = require("../../schemas/subscription.schema");
const date_range_1 = require("../../common/utils/date-range");
const payments_service_1 = require("../payments/payments.service");
const payment_schema_1 = require("../../schemas/payment.schema");
const table_schema_1 = require("../../schemas/table.schema");
const event_emitter_1 = require("@nestjs/event-emitter");
const order_events_1 = require("../../common/events/order-events");
const order_statistics_service_1 = require("../order-statistics/order-statistics.service");
const coupons_service_1 = require("../coupons/coupons.service");
const decorators_1 = require("../../common/decorators");
const precision_1 = require("../../common/utils/precision");
const tax_1 = require("../../common/utils/tax");
let OrdersService = class OrdersService {
    constructor(orderModel, restaurantModel, organizationModel, subscriptionModel, paymentModel, tableModel, paymentsService, eventEmitter, orderStatisticsService, couponsService) {
        this.orderModel = orderModel;
        this.restaurantModel = restaurantModel;
        this.organizationModel = organizationModel;
        this.subscriptionModel = subscriptionModel;
        this.paymentModel = paymentModel;
        this.tableModel = tableModel;
        this.paymentsService = paymentsService;
        this.eventEmitter = eventEmitter;
        this.orderStatisticsService = orderStatisticsService;
        this.couponsService = couponsService;
        this.orderRelationPopulate = [
            {
                path: 'restaurantId',
                select: 'name slug owner_name restaurant_type description logo address phone email gst_no vat_no cr_number receipt_header_note taxEnabled taxRate taxType vatEnabled vatRate vatType isActive menuPdf organizationId',
            },
            {
                path: 'tableId',
                select: 'tableNumber capacity restaurantId qrCode isActive',
            },
        ];
    }
    toObjectId(value, fieldName) {
        if (!value) {
            throw new common_1.BadRequestException(`Invalid ${fieldName}`);
        }
        if (value instanceof mongoose_2.Types.ObjectId) {
            return value;
        }
        const valueString = value.toString();
        if (!mongoose_2.Types.ObjectId.isValid(valueString)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName}`);
        }
        return new mongoose_2.Types.ObjectId(valueString);
    }
    async validateOrgRestaurant(restaurantId, organizationId) {
        const restaurantObjectId = this.toObjectId(restaurantId, 'restaurantId');
        const organizationObjectId = this.toObjectId(organizationId, 'organizationId');
        const restaurant = await this.restaurantModel
            .findById(restaurantObjectId)
            .select('organizationId');
        const restaurantOrgId = restaurant?.organizationId?._id?.toString?.() ??
            restaurant?.organizationId?.toString?.() ??
            (restaurant?.organizationId ? String(restaurant.organizationId) : undefined);
        if (!restaurant ||
            !restaurantOrgId ||
            restaurantOrgId !== organizationObjectId.toString()) {
            throw new common_1.ForbiddenException('Restaurant does not belong to your organization');
        }
    }
    async generateOrderNumber(restaurantId) {
        const restaurantObjectId = restaurantId instanceof mongoose_2.Types.ObjectId
            ? restaurantId
            : new mongoose_2.Types.ObjectId(restaurantId);
        const restaurantIdString = restaurantObjectId.toString();
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const latestOrder = await this.orderModel
            .findOne({
            restaurantId: restaurantObjectId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
            .sort({ createdAt: -1 })
            .select('orderNumber')
            .lean();
        let nextSequence = 1;
        const lastSequence = latestOrder?.orderNumber?.match(/(\d{5})$/)?.[1];
        if (lastSequence) {
            nextSequence = Number(lastSequence) + 1;
        }
        const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const restaurantPart = restaurantIdString.slice(-4).toUpperCase();
        const sequencePart = String(nextSequence).padStart(5, '0');
        return `ORD-${datePart}-${restaurantPart}-${sequencePart}`;
    }
    async isPaymentGatewayAllocatedForRestaurant(restaurant) {
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
    async create(dto) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        const tableId = typeof dto.tableId === 'string' ? dto.tableId.trim() : '';
        if (tableId && !mongoose_2.Types.ObjectId.isValid(tableId)) {
            throw new common_1.BadRequestException('Invalid tableId');
        }
        for (const item of dto.items || []) {
            if (!mongoose_2.Types.ObjectId.isValid(item.menuItemId)) {
                throw new common_1.BadRequestException('Invalid menuItemId');
            }
        }
        const restaurant = await this.restaurantModel.findById(dto.restaurantId);
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        const pricedItems = await this.couponsService.priceOrderItems(dto.restaurantId, dto.items || []);
        const isPaymentGatewayAllocated = await this.isPaymentGatewayAllocatedForRestaurant(restaurant);
        const totals = this.computeTotalsForItems(restaurant, pricedItems);
        const { subtotalAmount, taxAmount, taxRate, taxType, cgstRate, sgstRate, cgstAmount, sgstAmount, vatAmount, vatRate, vatType, vatBreakdown, gstBreakdown, gstBase, vatBase, } = totals;
        const foodBase = gstBase;
        const liquorBase = vatBase;
        const orderSubtotal = (0, precision_1.roundTo3)(pricedItems.reduce((sum, i) => sum + i.price * i.quantity, 0));
        const preDiscountTotal = (0, precision_1.roundTo3)(subtotalAmount + taxAmount);
        const coupon = dto.couponCode
            ? await this.couponsService.validateCoupon(dto.restaurantId, dto.couponCode, orderSubtotal)
            : null;
        const couponDiscount = (0, precision_1.roundTo3)(coupon?.discountAmount || 0);
        const rawManualType = dto.manualDiscountType || dto.manual_discount_type;
        const rawManualValue = dto.manualDiscountValue ?? dto.manual_discount_value;
        const rawManualReason = dto.manualDiscountReason ?? dto.manual_discount_reason;
        const manualDiscountInfo = this.calculateManualDiscount(rawManualType, rawManualValue, rawManualReason, orderSubtotal, couponDiscount);
        const discountAmount = (0, precision_1.roundTo3)(couponDiscount + manualDiscountInfo.manualDiscountAmount);
        const totalAmount = Math.max(0, (0, precision_1.roundTo3)(preDiscountTotal - discountAmount));
        const orderType = dto.orderType
            ? dto.orderType
            : tableId
                ? 'dine_in'
                : 'takeaway';
        const paymentMethod = (dto.paymentMethod
            ? String(dto.paymentMethod).toUpperCase()
            : order_schema_1.PaymentMethod.CASH);
        const paymentStatus = (dto.paymentStatus
            ? String(dto.paymentStatus).toLowerCase()
            : order_schema_1.PaymentStatus.PENDING);
        const restaurantObjectId = new mongoose_2.Types.ObjectId(dto.restaurantId);
        const tableObjectId = tableId ? new mongoose_2.Types.ObjectId(tableId) : null;
        if (tableObjectId) {
            const table = await this.tableModel
                .findById(tableObjectId)
                .select('restaurantId isActive')
                .lean();
            if (!table || !table.isActive) {
                throw new common_1.BadRequestException('Invalid tableId');
            }
            if (table.restaurantId?.toString() !== restaurantObjectId.toString()) {
                throw new common_1.BadRequestException('Selected table does not belong to this restaurant');
            }
            const existingActiveOrder = await this.orderModel
                .findOne({
                tableId: tableObjectId,
                status: { $ne: order_schema_1.OrderStatus.CANCELLED },
                $nor: [
                    {
                        status: order_schema_1.OrderStatus.COMPLETED,
                        paymentStatus: order_schema_1.PaymentStatus.PAID,
                    },
                ],
            })
                .select('orderNumber status paymentStatus')
                .lean();
            if (existingActiveOrder) {
                throw new common_1.BadRequestException('This table is currently engaged. Complete payment or cancel the active order before placing a new order.');
            }
        }
        const orderNumber = await this.generateOrderNumber(restaurantObjectId);
        const { tableId: _tableId, ...orderDto } = dto;
        const normalizedOrderInstructions = (dto.order_instructions ||
            dto.orderInstructions ||
            dto.orderNotes ||
            '').trim();
        let order;
        try {
            order = await this.orderModel.create({
                ...orderDto,
                order_instructions: normalizedOrderInstructions,
                orderInstructions: normalizedOrderInstructions,
                orderNotes: normalizedOrderInstructions,
                restaurantId: restaurantObjectId,
                tableId: tableObjectId,
                items: pricedItems.map((i) => ({
                    ...i,
                    menuItemId: new mongoose_2.Types.ObjectId(i.menuItemId),
                    status: order_schema_1.OrderItemStatus.ACTIVE,
                    cancelledQuantity: 0,
                    cancelReason: '',
                })),
                orderNumber,
                orderType,
                gstBase,
                vatBase,
                vatBreakdown,
                gstBreakdown,
                paymentMethod,
                paymentStatus,
                subtotalAmount,
                taxAmount,
                taxRate,
                taxType,
                cgstRate,
                sgstRate,
                cgstAmount,
                sgstAmount,
                vatAmount,
                vatRate,
                vatType,
                foodSubtotal: foodBase,
                liquorSubtotal: liquorBase,
                couponId: coupon?.coupon._id,
                couponCode: coupon?.coupon.code,
                discountAmount,
                manualDiscountType: manualDiscountInfo.manualDiscountType,
                manualDiscountValue: manualDiscountInfo.manualDiscountValue,
                manualDiscountAmount: manualDiscountInfo.manualDiscountAmount,
                manualDiscountReason: manualDiscountInfo.manualDiscountReason,
                manual_discount_type: manualDiscountInfo.manualDiscountType,
                manual_discount_value: manualDiscountInfo.manualDiscountValue,
                manual_discount_amount: manualDiscountInfo.manualDiscountAmount,
                manual_discount_reason: manualDiscountInfo.manualDiscountReason,
                totalAmount,
                status: order_schema_1.OrderStatus.PENDING,
                isPaymentGatewayAllocated,
            });
        }
        catch (err) {
            if (err?.code !== 11000 || !err?.keyPattern?.orderNumber) {
                throw err;
            }
            order = await this.orderModel.create({
                ...orderDto,
                order_instructions: normalizedOrderInstructions,
                orderInstructions: normalizedOrderInstructions,
                orderNotes: normalizedOrderInstructions,
                restaurantId: restaurantObjectId,
                tableId: tableObjectId,
                items: pricedItems.map((i) => ({
                    ...i,
                    menuItemId: new mongoose_2.Types.ObjectId(i.menuItemId),
                    status: order_schema_1.OrderItemStatus.ACTIVE,
                    cancelledQuantity: 0,
                    cancelReason: '',
                })),
                orderNumber: await this.generateOrderNumber(restaurantObjectId),
                orderType,
                gstBase,
                vatBase,
                vatBreakdown,
                gstBreakdown,
                paymentMethod,
                paymentStatus,
                subtotalAmount,
                taxAmount,
                taxRate,
                taxType,
                cgstRate,
                sgstRate,
                cgstAmount,
                sgstAmount,
                vatAmount,
                vatRate,
                vatType,
                foodSubtotal: foodBase,
                liquorSubtotal: liquorBase,
                couponId: coupon?.coupon._id,
                couponCode: coupon?.coupon.code,
                discountAmount,
                manualDiscountType: manualDiscountInfo.manualDiscountType,
                manualDiscountValue: manualDiscountInfo.manualDiscountValue,
                manualDiscountAmount: manualDiscountInfo.manualDiscountAmount,
                manualDiscountReason: manualDiscountInfo.manualDiscountReason,
                manual_discount_type: manualDiscountInfo.manualDiscountType,
                manual_discount_value: manualDiscountInfo.manualDiscountValue,
                manual_discount_amount: manualDiscountInfo.manualDiscountAmount,
                manual_discount_reason: manualDiscountInfo.manualDiscountReason,
                totalAmount,
                status: order_schema_1.OrderStatus.PENDING,
                isPaymentGatewayAllocated,
            });
        }
        if (coupon) {
            try {
                await this.couponsService.recordUsage(coupon.coupon._id, order._id, couponDiscount);
            }
            catch (error) {
                await this.orderModel.findByIdAndDelete(order._id);
                throw error;
            }
        }
        this.eventEmitter.emit(order_events_1.OrderEvent.CREATED, new order_events_1.OrderCreatedEvent(order._id.toString(), restaurantObjectId.toString(), restaurant.organizationId, order.orderNumber, order.totalAmount));
        if (order.paymentStatus === order_schema_1.PaymentStatus.PAID) {
            this.eventEmitter.emit(order_events_1.OrderEvent.PAYMENT_STATUS_CHANGED, new order_events_1.OrderPaymentStatusChangedEvent(order._id.toString(), restaurantObjectId.toString(), order_schema_1.PaymentStatus.PENDING, order_schema_1.PaymentStatus.PAID, restaurant.organizationId, order.totalAmount));
        }
        return order;
    }
    async createForCustomerApp(dto) {
        const order = await this.create({
            ...dto,
            paymentStatus: order_schema_1.PaymentStatus.PENDING,
        });
        if (order.tableId ||
            !order?.isPaymentGatewayAllocated ||
            order.paymentMethod !== order_schema_1.PaymentMethod.ONLINE) {
            return {
                order,
                paymentRequired: false,
            };
        }
        const payment = await this.paymentsService.createOrderForOrder(order);
        const refreshedOrder = await this.orderModel.findById(order._id);
        return {
            order: refreshedOrder || order,
            paymentRequired: true,
            payment,
        };
    }
    async rollbackFailedCustomerOrder(orderId, razorpayOrderId) {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            return { message: 'Order already removed' };
        }
        if (!order.isPaymentGatewayAllocated) {
            throw new common_1.BadRequestException('Rollback is only allowed for paid orders');
        }
        if (order.paymentStatus === order_schema_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Cannot rollback an order with successful payment');
        }
        if (order.razorpayOrderId !== razorpayOrderId) {
            throw new common_1.BadRequestException('Invalid rollback request');
        }
        await this.paymentModel.deleteMany({ orderId: order._id });
        await this.couponsService.revertUsage(order._id);
        await this.orderModel.findByIdAndDelete(orderId);
        return { message: 'Failed payment order removed successfully' };
    }
    async updateCustomerTableOrderItems(id, items) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid orderId');
        }
        if (!items?.length) {
            throw new common_1.BadRequestException('Order must contain at least one item');
        }
        for (const item of items) {
            if (!mongoose_2.Types.ObjectId.isValid(item.menuItemId)) {
                throw new common_1.BadRequestException('Invalid menuItemId');
            }
            if (Number(item.quantity) <= 0) {
                throw new common_1.BadRequestException('Item quantity must be greater than 0');
            }
        }
        const order = await this.orderModel.findById(id);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (!order.tableId) {
            throw new common_1.BadRequestException('Only table orders can be updated');
        }
        if (order.paymentStatus === order_schema_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Paid orders cannot be updated');
        }
        if ([order_schema_1.OrderStatus.CANCELLED, order_schema_1.OrderStatus.COMPLETED].includes(order.status)) {
            throw new common_1.BadRequestException(`Order cannot be updated when status is '${order.status}'`);
        }
        const restaurant = await this.restaurantModel.findById(order.restaurantId);
        if (!restaurant)
            throw new common_1.NotFoundException('Restaurant not found');
        const pricedItems = await this.couponsService.priceOrderItems(order.restaurantId.toString(), items);
        const normalizedItems = pricedItems.map((item) => ({
            menuItemId: new mongoose_2.Types.ObjectId(item.menuItemId),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            itemType: item.itemType || 'food',
            gstRate: Number(item.gstRate) || 0,
            vatRate: Number(item.vatRate) || 0,
            status: order_schema_1.OrderItemStatus.ACTIVE,
            cancelledQuantity: 0,
            cancelReason: '',
            spiceLevel: item.spiceLevel
                ? {
                    name: item.spiceLevel.name,
                    emoji: item.spiceLevel.emoji || '',
                    priceDelta: Number(item.spiceLevel.priceDelta) || 0,
                }
                : undefined,
            addOns: (item.addOns || []).map((addOn) => ({
                name: addOn.name,
                emoji: addOn.emoji || '',
                priceDelta: Number(addOn.priceDelta) || 0,
            })),
            specialInstructions: item.specialInstructions || '',
        }));
        const totals = this.computeTotalsForItems(restaurant, normalizedItems);
        order.items = normalizedItems;
        order.subtotalAmount = totals.subtotalAmount;
        order.taxAmount = totals.taxAmount;
        order.taxRate = totals.taxRate;
        order.taxType = totals.taxType;
        order.cgstRate = totals.cgstRate;
        order.sgstRate = totals.sgstRate;
        order.cgstAmount = totals.cgstAmount;
        order.sgstAmount = totals.sgstAmount;
        order.vatAmount = totals.vatAmount;
        order.vatRate = totals.vatRate;
        order.vatType = totals.vatType;
        order.foodSubtotal = totals.foodSubtotal;
        order.liquorSubtotal = totals.liquorSubtotal;
        order.gstBase = totals.gstBase;
        order.vatBase = totals.vatBase;
        order.vatBreakdown = totals.vatBreakdown;
        order.gstBreakdown = totals.gstBreakdown;
        order.totalAmount = totals.totalAmount;
        if (order.razorpayOrderId) {
            await this.paymentModel.deleteMany({ orderId: order._id });
            order.razorpayOrderId = '';
            order.razorpayPaymentId = '';
            order.paymentId = '';
            order.paymentStatus = order_schema_1.PaymentStatus.PENDING;
        }
        if (order.paymentMethod && typeof order.paymentMethod === 'string') {
            order.paymentMethod = order.paymentMethod.toUpperCase();
        }
        if (order.paymentStatus && typeof order.paymentStatus === 'string') {
            order.paymentStatus = order.paymentStatus.toLowerCase();
        }
        await order.save();
        return this.getStatus(id);
    }
    async updateOrderItems(id, dto, role, organizationId, userRestaurantId) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid orderId');
        }
        if (!dto.items?.length) {
            throw new common_1.BadRequestException('Order must contain at least one item');
        }
        const order = await this.orderModel.findById(id);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (role === decorators_1.Role.ORG_ADMIN) {
            if (!organizationId)
                throw new common_1.ForbiddenException('Organization not assigned');
            await this.validateOrgRestaurant(order.restaurantId, organizationId);
        }
        else if (role !== decorators_1.Role.SUPER_ADMIN) {
            if (!userRestaurantId ||
                order.restaurantId.toString() !== userRestaurantId.toString()) {
                throw new common_1.ForbiddenException('Restaurant access denied');
            }
        }
        if (order.paymentStatus === order_schema_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Paid orders cannot be updated');
        }
        if ([order_schema_1.OrderStatus.CANCELLED, order_schema_1.OrderStatus.COMPLETED].includes(order.status)) {
            throw new common_1.BadRequestException(`Order cannot be updated when status is '${order.status}'`);
        }
        if (order.items.some((item) => Number(item.cancelledQuantity || 0) > 0)) {
            throw new common_1.BadRequestException('Orders with cancelled items cannot be updated');
        }
        const restaurantId = order.restaurantId.toString();
        const restaurant = await this.restaurantModel.findById(order.restaurantId);
        if (!restaurant)
            throw new common_1.NotFoundException('Restaurant not found');
        const pricedItems = await this.couponsService.priceOrderItems(restaurantId, dto.items);
        const totals = this.computeTotalsForItems(restaurant, pricedItems);
        const orderSubtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const couponCode = dto.couponCode?.trim();
        const coupon = couponCode
            ? await this.couponsService.validateCoupon(restaurantId, couponCode, orderSubtotal, order._id)
            : null;
        const couponDiscount = (0, precision_1.roundTo3)(coupon?.discountAmount || 0);
        await this.couponsService.replaceUsage(order._id, coupon?.coupon._id || null, couponDiscount);
        const hasManualTypeInDto = dto.manualDiscountType !== undefined || dto.manual_discount_type !== undefined;
        const rawManualType = hasManualTypeInDto
            ? dto.manualDiscountType || dto.manual_discount_type
            : order.manualDiscountType || order.manual_discount_type;
        const rawManualValue = hasManualTypeInDto
            ? (dto.manualDiscountValue ?? dto.manual_discount_value)
            : (order.manualDiscountValue ?? order.manual_discount_value);
        const rawManualReason = hasManualTypeInDto
            ? (dto.manualDiscountReason ?? dto.manual_discount_reason)
            : (order.manualDiscountReason ?? order.manual_discount_reason);
        const manualDiscountInfo = this.calculateManualDiscount(rawManualType, rawManualValue, rawManualReason, orderSubtotal, couponDiscount);
        const totalDiscountAmount = (0, precision_1.roundTo3)(couponDiscount + manualDiscountInfo.manualDiscountAmount);
        order.items = pricedItems.map((item) => ({
            ...item,
            menuItemId: new mongoose_2.Types.ObjectId(item.menuItemId),
            status: order_schema_1.OrderItemStatus.ACTIVE,
            cancelledQuantity: 0,
            cancelReason: '',
        }));
        order.subtotalAmount = totals.subtotalAmount;
        order.taxAmount = totals.taxAmount;
        order.taxRate = totals.taxRate;
        order.taxType = totals.taxType;
        order.cgstRate = totals.cgstRate;
        order.sgstRate = totals.sgstRate;
        order.cgstAmount = totals.cgstAmount;
        order.sgstAmount = totals.sgstAmount;
        order.vatAmount = totals.vatAmount;
        order.vatRate = totals.vatRate;
        order.vatType = totals.vatType;
        order.foodSubtotal = totals.foodSubtotal;
        order.liquorSubtotal = totals.liquorSubtotal;
        order.gstBase = totals.gstBase;
        order.vatBase = totals.vatBase;
        order.vatBreakdown = totals.vatBreakdown;
        order.gstBreakdown = totals.gstBreakdown;
        order.couponId = coupon?.coupon._id;
        order.couponCode = coupon?.coupon.code || '';
        order.manualDiscountType = manualDiscountInfo.manualDiscountType;
        order.manualDiscountValue = manualDiscountInfo.manualDiscountValue;
        order.manualDiscountAmount = manualDiscountInfo.manualDiscountAmount;
        order.manualDiscountReason = manualDiscountInfo.manualDiscountReason;
        order.manual_discount_type = manualDiscountInfo.manualDiscountType;
        order.manual_discount_value = manualDiscountInfo.manualDiscountValue;
        order.manual_discount_amount = manualDiscountInfo.manualDiscountAmount;
        order.manual_discount_reason = manualDiscountInfo.manualDiscountReason;
        order.discountAmount = totalDiscountAmount;
        order.totalAmount = Math.max(0, (0, precision_1.roundTo3)(totals.totalAmount - totalDiscountAmount));
        if (order.razorpayOrderId) {
            await this.paymentModel.deleteMany({ orderId: order._id });
            order.razorpayOrderId = '';
            order.razorpayPaymentId = '';
            order.paymentId = '';
            order.paymentStatus = order_schema_1.PaymentStatus.PENDING;
        }
        if (order.paymentMethod && typeof order.paymentMethod === 'string') {
            order.paymentMethod = order.paymentMethod.toUpperCase();
        }
        if (order.paymentStatus && typeof order.paymentStatus === 'string') {
            order.paymentStatus = order.paymentStatus.toLowerCase();
        }
        await order.save();
        this.eventEmitter.emit(order_events_1.OrderEvent.UPDATED, new order_events_1.OrderUpdatedEvent(order._id.toString(), order.restaurantId?.toString(), { action: 'items_updated' }));
        return this.findOne(id);
    }
    calculateManualDiscount(rawType, rawValue, rawReason, orderSubtotal, couponDiscount = 0) {
        if (!rawType) {
            return {
                manualDiscountType: null,
                manualDiscountValue: 0,
                manualDiscountAmount: 0,
                manualDiscountReason: '',
            };
        }
        const typeStr = String(rawType).toUpperCase().trim();
        if (typeStr !== order_schema_1.ManualDiscountType.PERCENTAGE &&
            typeStr !== order_schema_1.ManualDiscountType.FIXED) {
            return {
                manualDiscountType: null,
                manualDiscountValue: 0,
                manualDiscountAmount: 0,
                manualDiscountReason: '',
            };
        }
        const type = typeStr;
        const value = (0, precision_1.roundTo3)(Math.max(0, Number(rawValue) || 0));
        const reason = typeof rawReason === 'string' ? rawReason.trim() : '';
        if (type === order_schema_1.ManualDiscountType.PERCENTAGE && value > 100) {
            throw new common_1.BadRequestException('Manual discount percentage cannot exceed 100%');
        }
        if (type === order_schema_1.ManualDiscountType.FIXED && value > orderSubtotal) {
            throw new common_1.BadRequestException('Manual discount fixed amount cannot exceed order subtotal');
        }
        let rawCalculatedAmount = 0;
        if (type === order_schema_1.ManualDiscountType.PERCENTAGE) {
            rawCalculatedAmount = (0, precision_1.roundTo3)((orderSubtotal * value) / 100);
        }
        else {
            rawCalculatedAmount = (0, precision_1.roundTo3)(Math.min(value, orderSubtotal));
        }
        const remainingSubtotal = Math.max(0, (0, precision_1.roundTo3)(orderSubtotal - couponDiscount));
        const manualDiscountAmount = (0, precision_1.roundTo3)(Math.min(rawCalculatedAmount, remainingSubtotal));
        return {
            manualDiscountType: type,
            manualDiscountValue: value,
            manualDiscountAmount,
            manualDiscountReason: reason,
        };
    }
    computeTotalsForItems(restaurant, items) {
        const breakdown = (0, tax_1.computeTaxBreakdown)({
            taxEnabled: restaurant?.taxEnabled,
            taxRate: restaurant?.taxRate,
            taxType: restaurant?.taxType,
            vatEnabled: restaurant?.vatEnabled,
            vatRate: restaurant?.vatRate,
            vatType: restaurant?.vatType,
        }, items.map((i) => {
            const rates = this.resolveItemTaxRates(i, {
                taxRate: restaurant?.taxRate,
                vatRate: restaurant?.vatRate,
            });
            return {
                menuItemId: i.menuItemId?.toString(),
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                gstRate: rates.gstRate,
                vatRate: rates.vatRate,
            };
        }));
        return {
            ...breakdown,
            foodSubtotal: breakdown.gstBase,
            liquorSubtotal: breakdown.vatBase,
        };
    }
    resolveItemTaxRates(item, fallback) {
        const hasGst = item.gstRate != null && Number(item.gstRate) >= 0;
        const hasVat = item.vatRate != null && Number(item.vatRate) >= 0;
        if (hasGst || hasVat) {
            return {
                gstRate: hasGst ? Number(item.gstRate) : Number(fallback.taxRate) || 0,
                vatRate: hasVat ? Number(item.vatRate) : Number(fallback.vatRate) || 0,
            };
        }
        if (item.itemType === 'liquor') {
            return { gstRate: 0, vatRate: Number(fallback.vatRate) || 0 };
        }
        return {
            gstRate: Number(fallback.taxRate) || 0,
            vatRate: Number(fallback.vatRate) || 0,
        };
    }
    async cancelOrderItem(id, dto, userId) {
        const order = await this.orderModel.findById(id);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (![order_schema_1.OrderStatus.PENDING, order_schema_1.OrderStatus.CONFIRMED].includes(order.status)) {
            throw new common_1.BadRequestException(`Item cancellation is not allowed when order is '${order.status}'`);
        }
        const idx = dto.itemIndex;
        if (idx < 0 || idx >= (order.items || []).length) {
            throw new common_1.BadRequestException('Invalid itemIndex');
        }
        const item = order.items[idx];
        const totalQty = Number(item.quantity || 0);
        const cancelledQty = Number(item.cancelledQuantity || 0);
        const remainingQty = totalQty - cancelledQty;
        if (remainingQty <= 0) {
            throw new common_1.BadRequestException('Item already fully cancelled');
        }
        if (dto.cancelQuantity > remainingQty) {
            throw new common_1.BadRequestException(`Cancel quantity cannot exceed remaining quantity (${remainingQty})`);
        }
        item.cancelledQuantity = cancelledQty + dto.cancelQuantity;
        item.cancelReason = dto.reason;
        item.cancelledBy = new mongoose_2.Types.ObjectId(userId);
        item.cancelledAt = new Date();
        item.status =
            item.cancelledQuantity >= totalQty
                ? order_schema_1.OrderItemStatus.CANCELLED
                : order_schema_1.OrderItemStatus.ACTIVE;
        const restaurant = await this.restaurantModel.findById(order.restaurantId);
        const effectiveItems = (order.items || [])
            .map((it) => {
            const qty = Number(it.quantity || 0);
            const cQty = Number(it.cancelledQuantity || 0);
            const effQty = Math.max(0, qty - cQty);
            return { ...it.toObject?.(), price: it.price, quantity: effQty };
        })
            .filter((it) => Number(it.quantity) > 0);
        const totals = this.computeTotalsForItems(restaurant, effectiveItems);
        order.subtotalAmount = totals.subtotalAmount;
        order.taxAmount = totals.taxAmount;
        order.taxRate = totals.taxRate;
        order.taxType = totals.taxType;
        order.cgstRate = totals.cgstRate;
        order.sgstRate = totals.sgstRate;
        order.cgstAmount = totals.cgstAmount;
        order.sgstAmount = totals.sgstAmount;
        order.vatAmount = totals.vatAmount;
        order.vatRate = totals.vatRate;
        order.vatType = totals.vatType;
        order.foodSubtotal = totals.foodSubtotal;
        order.liquorSubtotal = totals.liquorSubtotal;
        order.gstBase = totals.gstBase;
        order.vatBase = totals.vatBase;
        order.vatBreakdown = totals.vatBreakdown;
        order.gstBreakdown = totals.gstBreakdown;
        const effectiveOrderSubtotal = (0, precision_1.roundTo3)(totals.foodSubtotal + totals.liquorSubtotal);
        const existingManualType = order.manualDiscountType || order.manual_discount_type;
        const existingManualVal = order.manualDiscountValue ?? order.manual_discount_value ?? 0;
        const existingManualReason = order.manualDiscountReason || order.manual_discount_reason || '';
        const existingManualAmt = Number(order.manualDiscountAmount || order.manual_discount_amount || 0);
        const couponDiscount = Math.max(0, (0, precision_1.roundTo3)((order.discountAmount || 0) - existingManualAmt));
        let totalDiscountAmount = (0, precision_1.roundTo3)(order.discountAmount || 0);
        if (existingManualType) {
            const manualDiscountInfo = this.calculateManualDiscount(existingManualType, existingManualVal, existingManualReason, effectiveOrderSubtotal, couponDiscount);
            order.manualDiscountAmount = manualDiscountInfo.manualDiscountAmount;
            order.manual_discount_amount = manualDiscountInfo.manualDiscountAmount;
            totalDiscountAmount = (0, precision_1.roundTo3)(couponDiscount + manualDiscountInfo.manualDiscountAmount);
        }
        else {
            totalDiscountAmount = Math.min(totalDiscountAmount, effectiveOrderSubtotal);
        }
        order.discountAmount = totalDiscountAmount;
        order.totalAmount = Math.max(0, (0, precision_1.roundTo3)(totals.totalAmount - totalDiscountAmount));
        const allCancelled = (order.items || []).every((it) => {
            const qty = Number(it.quantity || 0);
            const cQty = Number(it.cancelledQuantity || 0);
            return qty > 0 && cQty >= qty;
        });
        const previousStatus = order.status;
        if (allCancelled) {
            order.status = order_schema_1.OrderStatus.CANCELLED;
        }
        if (order.paymentMethod && typeof order.paymentMethod === 'string') {
            order.paymentMethod = order.paymentMethod.toUpperCase();
        }
        if (order.paymentStatus && typeof order.paymentStatus === 'string') {
            order.paymentStatus = order.paymentStatus.toLowerCase();
        }
        await order.save();
        this.eventEmitter.emit(order_events_1.OrderEvent.UPDATED, new order_events_1.OrderUpdatedEvent(order._id.toString(), order.restaurantId?.toString(), { action: 'item_cancelled' }));
        if (previousStatus !== order.status) {
            this.eventEmitter.emit(order_events_1.OrderEvent.STATUS_CHANGED, new order_events_1.OrderStatusChangedEvent(order._id.toString(), order.restaurantId?.toString(), previousStatus, order.status, restaurant?.organizationId, order.totalAmount));
        }
        return order;
    }
    async findAll(restaurantId, status, query) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', } = query || {};
        const filter = {};
        if (restaurantId) {
            if (!mongoose_2.Types.ObjectId.isValid(restaurantId)) {
                throw new common_1.BadRequestException('Invalid restaurantId');
            }
            filter.restaurantId = new mongoose_2.Types.ObjectId(restaurantId);
        }
        if (query?.tableId) {
            if (!mongoose_2.Types.ObjectId.isValid(query.tableId)) {
                throw new common_1.BadRequestException('Invalid tableId');
            }
            filter.tableId = new mongoose_2.Types.ObjectId(query.tableId);
        }
        if (status)
            filter.status = status;
        const range = (0, date_range_1.getDateRangeFromQuery)(query);
        if (range) {
            filter.createdAt = { $gte: range.from, $lte: range.to };
        }
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
            ];
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
            sort.createdAt = -1;
        }
        const skip = (page - 1) * limit;
        const [data, total, summaryResult] = await Promise.all([
            this.orderModel
                .find(filter)
                .populate(this.orderRelationPopulate)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.orderModel.countDocuments(filter).exec(),
            this.orderModel.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
                    },
                },
            ]),
        ]);
        const summary = summaryResult[0] || { totalOrders: 0, totalAmount: 0 };
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            summary: {
                totalOrders: summary.totalOrders || 0,
                totalAmount: summary.totalAmount || 0,
            },
        };
    }
    async findAllByOrganization(organizationId, status, query) {
        const orgRestaurants = await this.restaurantModel
            .find({ organizationId })
            .select('_id')
            .exec();
        const restaurantIds = orgRestaurants.map((r) => r._id);
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', } = query || {};
        const filter = { restaurantId: { $in: restaurantIds } };
        if (query?.tableId) {
            if (!mongoose_2.Types.ObjectId.isValid(query.tableId)) {
                throw new common_1.BadRequestException('Invalid tableId');
            }
            filter.tableId = new mongoose_2.Types.ObjectId(query.tableId);
        }
        if (status)
            filter.status = status;
        const range = (0, date_range_1.getDateRangeFromQuery)(query);
        if (range) {
            filter.createdAt = { $gte: range.from, $lte: range.to };
        }
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
            ];
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
            sort.createdAt = -1;
        }
        const skip = (page - 1) * limit;
        const [data, total, summaryResult] = await Promise.all([
            this.orderModel
                .find(filter)
                .populate(this.orderRelationPopulate)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.orderModel.countDocuments(filter).exec(),
            this.orderModel.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
                    },
                },
            ]),
        ]);
        const summary = summaryResult[0] || { totalOrders: 0, totalAmount: 0 };
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            summary: {
                totalOrders: summary.totalOrders || 0,
                totalAmount: summary.totalAmount || 0,
            },
        };
    }
    async findOne(id) {
        const order = await this.orderModel
            .findById(id)
            .populate(this.orderRelationPopulate);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async getInvoice(id) {
        const order = await this.orderModel
            .findById(id)
            .populate(this.orderRelationPopulate);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async getStatus(id) {
        const order = await this.orderModel
            .findById(id)
            .select('orderNumber status paymentStatus paymentMethod items totalAmount subtotalAmount taxAmount taxRate taxType cgstRate sgstRate cgstAmount sgstAmount vatAmount vatRate vatType foodSubtotal liquorSubtotal gstBase vatBase vatBreakdown gstBreakdown lineTaxes taxSnapshotAt orderType restaurantId tableId customerName customerPhone isPaymentGatewayAllocated couponId couponCode discountAmount manualDiscountType manualDiscountValue manualDiscountAmount manualDiscountReason manual_discount_type manual_discount_value manual_discount_amount manual_discount_reason createdAt')
            .populate(this.orderRelationPopulate);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async updateStatus(id, dto) {
        const existing = await this.orderModel
            .findById(id)
            .select('status restaurantId items taxRate taxType vatRate vatType taxSnapshotAt');
        if (!existing)
            throw new common_1.NotFoundException('Order not found');
        const previousStatus = existing.status;
        if (previousStatus !== dto.status) {
            if (!(0, order_schema_1.canTransitionOrderStatus)(previousStatus, dto.status)) {
                throw new common_1.BadRequestException(`Invalid status transition from '${previousStatus}' to '${dto.status}'`);
            }
        }
        const update = { status: dto.status };
        if (dto.status === order_schema_1.OrderStatus.COMPLETED && !existing.taxSnapshotAt) {
            const snapshot = (0, tax_1.computeTaxBreakdown)({
                taxEnabled: true,
                taxRate: existing.taxRate,
                taxType: existing.taxType,
                vatEnabled: true,
                vatRate: existing.vatRate,
                vatType: existing.vatType,
            }, (existing.items || [])
                .map((it) => {
                const rates = this.resolveItemTaxRates(it, {
                    taxRate: existing.taxRate,
                    vatRate: existing.vatRate,
                });
                return {
                    menuItemId: it.menuItemId?.toString(),
                    name: it.name,
                    price: Number(it.price) || 0,
                    quantity: Math.max(0, Number(it.quantity || 0) - Number(it.cancelledQuantity || 0)),
                    gstRate: rates.gstRate,
                    vatRate: rates.vatRate,
                };
            })
                .filter((it) => it.quantity > 0));
            update.lineTaxes = snapshot.lines;
            update.taxSnapshotAt = new Date();
        }
        const order = await this.orderModel.findByIdAndUpdate(id, update, {
            new: true,
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (previousStatus !== dto.status) {
            const restaurant = await this.restaurantModel
                .findById(order.restaurantId)
                .select('organizationId')
                .lean();
            this.eventEmitter.emit(order_events_1.OrderEvent.STATUS_CHANGED, new order_events_1.OrderStatusChangedEvent(order._id.toString(), order.restaurantId?.toString(), previousStatus, dto.status, restaurant?.organizationId, order.totalAmount, order.orderNumber));
        }
        return order;
    }
    async updatePaymentStatus(id, dto) {
        const existing = await this.orderModel
            .findById(id)
            .select('paymentStatus restaurantId totalAmount');
        if (!existing)
            throw new common_1.NotFoundException('Order not found');
        const previousStatus = existing.paymentStatus;
        const order = await this.orderModel.findByIdAndUpdate(id, { paymentStatus: dto.paymentStatus }, { new: true });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (previousStatus !== dto.paymentStatus) {
            const restaurant = await this.restaurantModel
                .findById(order.restaurantId)
                .select('organizationId')
                .lean();
            this.eventEmitter.emit(order_events_1.OrderEvent.PAYMENT_STATUS_CHANGED, new order_events_1.OrderPaymentStatusChangedEvent(order._id.toString(), order.restaurantId?.toString(), previousStatus, dto.paymentStatus, restaurant?.organizationId, order.totalAmount));
        }
        return order;
    }
    async updatePaymentMethod(id, dto) {
        const paymentMethod = (dto.paymentMethod
            ? String(dto.paymentMethod).toUpperCase()
            : order_schema_1.PaymentMethod.CASH);
        const order = await this.orderModel.findByIdAndUpdate(id, { paymentMethod }, { new: true, runValidators: true });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        this.eventEmitter.emit(order_events_1.OrderEvent.UPDATED, new order_events_1.OrderUpdatedEvent(order._id.toString(), order.restaurantId?.toString(), { action: 'payment_method_updated', paymentMethod }));
        return order;
    }
    async findByRestaurant(restaurantId) {
        if (!mongoose_2.Types.ObjectId.isValid(restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        return this.orderModel
            .find({ restaurantId: new mongoose_2.Types.ObjectId(restaurantId) })
            .populate(this.orderRelationPopulate)
            .sort({ createdAt: -1 })
            .exec();
    }
    async findByPhone(phone) {
        return this.orderModel
            .find({ customerPhone: phone })
            .populate(this.orderRelationPopulate)
            .sort({ createdAt: -1 })
            .exec();
    }
    async getStats(restaurantId, dateQuery) {
        const match = {};
        if (restaurantId) {
            match.restaurantId = this.toObjectId(restaurantId, 'restaurantId');
        }
        const range = (0, date_range_1.getDateRangeFromQuery)(dateQuery);
        if (range) {
            match.createdAt = { $gte: range.from, $lte: range.to };
        }
        return this.getStatsWithMatch(match);
    }
    async getStatsByAll(dateQuery) {
        const match = {};
        const range = (0, date_range_1.getDateRangeFromQuery)(dateQuery);
        if (range) {
            match.createdAt = { $gte: range.from, $lte: range.to };
        }
        return this.getStatsWithMatch(match);
    }
    async getStatsByOrganization(organizationId, dateQuery) {
        const organizationObjectId = this.toObjectId(organizationId, 'organizationId');
        const orgRestaurants = await this.restaurantModel
            .find({ organizationId: organizationObjectId })
            .select('_id')
            .exec();
        const restaurantIds = orgRestaurants.map((r) => r._id);
        const match = { restaurantId: { $in: restaurantIds } };
        const range = (0, date_range_1.getDateRangeFromQuery)(dateQuery);
        if (range) {
            match.createdAt = { $gte: range.from, $lte: range.to };
        }
        return this.getStatsWithMatch(match);
    }
    async getStatsWithMatch(match) {
        const completedMatch = { ...match, status: order_schema_1.OrderStatus.COMPLETED };
        const [totals] = await this.orderModel.aggregate([
            { $match: completedMatch },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSales: { $sum: '$totalAmount' },
                },
            },
        ]);
        const restaurantScope = match.restaurantId?.$in ?? match.restaurantId;
        const { completedOrderCount, totalOrderAmount } = await this.orderStatisticsService.getCompletedTotals(restaurantScope);
        const mostSoldItems = await this.orderModel.aggregate([
            { $match: completedMatch },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalQuantity: { $sum: '$items.quantity' },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
        ]);
        const hasDateFilter = Boolean(match.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const revenueDaily = await this.orderModel.aggregate([
            {
                $match: hasDateFilter
                    ? completedMatch
                    : { ...completedMatch, createdAt: { $gte: thirtyDaysAgo } },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
        const revenueWeekly = await this.orderModel.aggregate([
            {
                $match: hasDateFilter
                    ? completedMatch
                    : { ...completedMatch, createdAt: { $gte: twelveWeeksAgo } },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const revenueMonthly = await this.orderModel.aggregate([
            {
                $match: hasDateFilter
                    ? completedMatch
                    : { ...completedMatch, createdAt: { $gte: twelveMonthsAgo } },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const revenueYearly = await this.orderModel.aggregate([
            { $match: completedMatch },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const totalOrders = totals?.totalOrders || 0;
        const totalSales = totals?.totalSales || 0;
        return {
            totalOrders,
            totalSales,
            averageOrderValue: completedOrderCount
                ? totalOrderAmount / completedOrderCount
                : 0,
            totalCompletedOrders: completedOrderCount,
            totalCompletedSales: totalOrderAmount,
            mostSoldItems: mostSoldItems.map((item) => ({
                name: item._id,
                quantity: item.totalQuantity,
            })),
            revenueDaily: revenueDaily.map((r) => ({
                label: r._id,
                revenue: r.revenue,
                orders: r.orders,
            })),
            revenueWeekly: revenueWeekly.map((r) => ({
                label: r._id,
                revenue: r.revenue,
                orders: r.orders,
            })),
            revenueMonthly: revenueMonthly.map((r) => ({
                label: r._id,
                revenue: r.revenue,
                orders: r.orders,
            })),
            revenueYearly: revenueYearly.map((r) => ({
                label: r._id,
                revenue: r.revenue,
                orders: r.orders,
            })),
        };
    }
    async remove(id, role, organizationId, userRestaurantId) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid orderId');
        }
        const order = await this.orderModel.findById(id);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const allowedRoles = [
            decorators_1.Role.SUPER_ADMIN,
            decorators_1.Role.ORG_ADMIN,
            decorators_1.Role.RESTAURANT_OWNER,
            decorators_1.Role.CAPTAIN,
            decorators_1.Role.MANAGER,
        ];
        if (!allowedRoles.includes(role)) {
            throw new common_1.ForbiddenException('You do not have permission to delete orders');
        }
        const isCancelled = order.status === order_schema_1.OrderStatus.CANCELLED ||
            order.status === 'canceled';
        if (!isCancelled) {
            throw new common_1.BadRequestException('Only cancelled orders can be permanently deleted');
        }
        if (role === decorators_1.Role.ORG_ADMIN) {
            if (!organizationId) {
                throw new common_1.ForbiddenException('Organization not assigned');
            }
            await this.validateOrgRestaurant(order.restaurantId, organizationId);
        }
        else if (role !== decorators_1.Role.SUPER_ADMIN) {
            if (!userRestaurantId ||
                order.restaurantId.toString() !== userRestaurantId.toString()) {
                throw new common_1.ForbiddenException('Restaurant access denied');
            }
        }
        await this.paymentModel.deleteMany({ orderId: order._id });
        await this.couponsService.revertUsage(order._id);
        await this.orderModel.findByIdAndDelete(order._id);
        return {
            success: true,
            message: `Order #${order.orderNumber || id} deleted successfully`,
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(restaurant_schema_1.Restaurant.name)),
    __param(2, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __param(3, (0, mongoose_1.InjectModel)(subscription_schema_1.Subscription.name)),
    __param(4, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(5, (0, mongoose_1.InjectModel)(table_schema_1.Table.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        payments_service_1.PaymentsService,
        event_emitter_1.EventEmitter2,
        order_statistics_service_1.OrderStatisticsService,
        coupons_service_1.CouponsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map