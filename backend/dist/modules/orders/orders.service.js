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
let OrdersService = class OrdersService {
    constructor(orderModel, restaurantModel, organizationModel, subscriptionModel, paymentModel, tableModel, paymentsService) {
        this.orderModel = orderModel;
        this.restaurantModel = restaurantModel;
        this.organizationModel = organizationModel;
        this.subscriptionModel = subscriptionModel;
        this.paymentModel = paymentModel;
        this.tableModel = tableModel;
        this.paymentsService = paymentsService;
        this.orderRelationPopulate = [
            {
                path: 'restaurantId',
                select: 'name slug owner_name restaurant_type description logo address phone email gst_no vat_no taxEnabled taxRate taxType vatEnabled vatRate vatType isActive menuPdf organizationId',
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
        if (!restaurant ||
            !restaurant.organizationId?.equals(organizationObjectId)) {
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
        const isPaymentGatewayAllocated = await this.isPaymentGatewayAllocatedForRestaurant(restaurant);
        const foodItems = dto.items.filter((i) => (i.itemType || 'food') === 'food');
        const liquorItems = dto.items.filter((i) => (i.itemType || 'food') === 'liquor');
        const foodTotal = foodItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const liquorTotal = liquorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        let foodBase = foodTotal;
        let liquorBase = liquorTotal;
        let taxRate = 0;
        let taxType = 'exclusive';
        let cgstRate = 0;
        let sgstRate = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let vatAmount = 0;
        let vatRate = 0;
        let vatType = 'exclusive';
        if (restaurant?.taxEnabled && restaurant.taxRate > 0 && foodTotal > 0) {
            taxRate = restaurant.taxRate;
            taxType = restaurant.taxType || 'inclusive';
            cgstRate = Math.round((taxRate / 2) * 100) / 100;
            sgstRate = Math.round((taxRate / 2) * 100) / 100;
            if (taxType === 'inclusive') {
                foodBase = Math.round((foodTotal / (1 + taxRate / 100)) * 100) / 100;
                const gstTax = Math.round((foodTotal - foodBase) * 100) / 100;
                cgstAmount = Math.round((gstTax / 2) * 100) / 100;
                sgstAmount = Math.round((gstTax - cgstAmount) * 100) / 100;
            }
            else {
                foodBase = foodTotal;
                cgstAmount = Math.round(((foodBase * cgstRate) / 100) * 100) / 100;
                sgstAmount = Math.round(((foodBase * sgstRate) / 100) * 100) / 100;
            }
        }
        else if (restaurant?.taxEnabled) {
            taxRate = restaurant.taxRate;
            taxType = restaurant.taxType || 'inclusive';
        }
        if (restaurant?.vatEnabled && restaurant.vatRate > 0 && liquorTotal > 0) {
            vatRate = restaurant.vatRate;
            vatType = restaurant.vatType || 'inclusive';
            if (vatType === 'inclusive') {
                liquorBase =
                    Math.round((liquorTotal / (1 + vatRate / 100)) * 100) / 100;
                vatAmount = Math.round((liquorTotal - liquorBase) * 100) / 100;
            }
            else {
                liquorBase = liquorTotal;
                vatAmount = Math.round(((liquorBase * vatRate) / 100) * 100) / 100;
            }
        }
        else if (restaurant?.vatEnabled) {
            vatRate = restaurant.vatRate;
            vatType = restaurant.vatType || 'inclusive';
        }
        const subtotalAmount = foodBase + liquorBase;
        const taxAmount = cgstAmount + sgstAmount + vatAmount;
        const totalAmount = Math.round((subtotalAmount + taxAmount) * 100) / 100;
        const orderType = dto.orderType
            ? dto.orderType
            : tableId
                ? 'dine_in'
                : 'takeaway';
        const paymentMethod = tableId
            ? 'cash'
            : isPaymentGatewayAllocated && dto.paymentMethod === 'online'
                ? 'online'
                : 'cash';
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
                        status: order_schema_1.OrderStatus.SERVED,
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
        try {
            return await this.orderModel.create({
                ...orderDto,
                restaurantId: restaurantObjectId,
                tableId: tableObjectId,
                items: (dto.items || []).map((i) => ({
                    ...i,
                    menuItemId: new mongoose_2.Types.ObjectId(i.menuItemId),
                    status: order_schema_1.OrderItemStatus.ACTIVE,
                    cancelledQuantity: 0,
                    cancelReason: '',
                })),
                orderNumber,
                orderType,
                paymentMethod,
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
                totalAmount,
                status: order_schema_1.OrderStatus.PENDING,
                isPaymentGatewayAllocated,
            });
        }
        catch (err) {
            if (err?.code !== 11000 || !err?.keyPattern?.orderNumber) {
                throw err;
            }
            return this.orderModel.create({
                ...orderDto,
                restaurantId: restaurantObjectId,
                tableId: tableObjectId,
                items: (dto.items || []).map((i) => ({
                    ...i,
                    menuItemId: new mongoose_2.Types.ObjectId(i.menuItemId),
                    status: order_schema_1.OrderItemStatus.ACTIVE,
                    cancelledQuantity: 0,
                    cancelReason: '',
                })),
                orderNumber: await this.generateOrderNumber(restaurantObjectId),
                orderType,
                paymentMethod,
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
                totalAmount,
                status: order_schema_1.OrderStatus.PENDING,
                isPaymentGatewayAllocated,
            });
        }
    }
    async createForCustomerApp(dto) {
        const order = await this.create(dto);
        if (order.tableId ||
            !order?.isPaymentGatewayAllocated ||
            order.paymentMethod !== 'online') {
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
        if (order.paymentStatus === 'paid') {
            throw new common_1.BadRequestException('Cannot rollback an order with successful payment');
        }
        if (order.razorpayOrderId !== razorpayOrderId) {
            throw new common_1.BadRequestException('Invalid rollback request');
        }
        await this.paymentModel.deleteMany({ orderId: order._id });
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
        if ([order_schema_1.OrderStatus.CANCELLED, order_schema_1.OrderStatus.SERVED].includes(order.status)) {
            throw new common_1.BadRequestException(`Order cannot be updated when status is '${order.status}'`);
        }
        const restaurant = await this.restaurantModel.findById(order.restaurantId);
        if (!restaurant)
            throw new common_1.NotFoundException('Restaurant not found');
        const normalizedItems = items.map((item) => ({
            menuItemId: new mongoose_2.Types.ObjectId(item.menuItemId),
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            itemType: item.itemType || 'food',
            status: order_schema_1.OrderItemStatus.ACTIVE,
            cancelledQuantity: 0,
            cancelReason: '',
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
        order.totalAmount = totals.totalAmount;
        if (order.razorpayOrderId) {
            await this.paymentModel.deleteMany({ orderId: order._id });
            order.razorpayOrderId = '';
            order.razorpayPaymentId = '';
            order.paymentId = '';
            order.paymentStatus = order_schema_1.PaymentStatus.PENDING;
        }
        await order.save();
        return this.getStatus(id);
    }
    computeTotalsForItems(restaurant, items) {
        const foodItems = items.filter((i) => (i.itemType || 'food') === 'food');
        const liquorItems = items.filter((i) => (i.itemType || 'food') === 'liquor');
        const foodTotal = foodItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const liquorTotal = liquorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        let foodBase = foodTotal;
        let liquorBase = liquorTotal;
        let taxRate = 0;
        let taxType = 'exclusive';
        let cgstRate = 0;
        let sgstRate = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let vatAmount = 0;
        let vatRate = 0;
        let vatType = 'exclusive';
        if (restaurant?.taxEnabled && restaurant.taxRate > 0 && foodTotal > 0) {
            taxRate = restaurant.taxRate;
            taxType = restaurant.taxType || 'inclusive';
            cgstRate = Math.round((taxRate / 2) * 100) / 100;
            sgstRate = Math.round((taxRate / 2) * 100) / 100;
            if (taxType === 'inclusive') {
                foodBase = Math.round((foodTotal / (1 + taxRate / 100)) * 100) / 100;
                const gstTax = Math.round((foodTotal - foodBase) * 100) / 100;
                cgstAmount = Math.round((gstTax / 2) * 100) / 100;
                sgstAmount = Math.round((gstTax - cgstAmount) * 100) / 100;
            }
            else {
                foodBase = foodTotal;
                cgstAmount = Math.round(((foodBase * cgstRate) / 100) * 100) / 100;
                sgstAmount = Math.round(((foodBase * sgstRate) / 100) * 100) / 100;
            }
        }
        else if (restaurant?.taxEnabled) {
            taxRate = restaurant.taxRate;
            taxType = restaurant.taxType || 'inclusive';
        }
        if (restaurant?.vatEnabled && restaurant.vatRate > 0 && liquorTotal > 0) {
            vatRate = restaurant.vatRate;
            vatType = restaurant.vatType || 'inclusive';
            if (vatType === 'inclusive') {
                liquorBase =
                    Math.round((liquorTotal / (1 + vatRate / 100)) * 100) / 100;
                vatAmount = Math.round((liquorTotal - liquorBase) * 100) / 100;
            }
            else {
                liquorBase = liquorTotal;
                vatAmount = Math.round(((liquorBase * vatRate) / 100) * 100) / 100;
            }
        }
        else if (restaurant?.vatEnabled) {
            vatRate = restaurant.vatRate;
            vatType = restaurant.vatType || 'inclusive';
        }
        const subtotalAmount = foodBase + liquorBase;
        const taxAmount = cgstAmount + sgstAmount + vatAmount;
        const totalAmount = Math.round((subtotalAmount + taxAmount) * 100) / 100;
        return {
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
            totalAmount,
        };
    }
    async cancelOrderItem(id, dto, userId) {
        const order = await this.orderModel.findById(id);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (![
            order_schema_1.OrderStatus.PENDING,
            order_schema_1.OrderStatus.CONFIRMED,
            order_schema_1.OrderStatus.PREPARING,
        ].includes(order.status)) {
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
        order.totalAmount = totals.totalAmount;
        const allCancelled = (order.items || []).every((it) => {
            const qty = Number(it.quantity || 0);
            const cQty = Number(it.cancelledQuantity || 0);
            return qty > 0 && cQty >= qty;
        });
        if (allCancelled) {
            order.status = order_schema_1.OrderStatus.CANCELLED;
        }
        await order.save();
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
    async getStatus(id) {
        const order = await this.orderModel
            .findById(id)
            .select('orderNumber status paymentStatus paymentMethod items totalAmount subtotalAmount taxAmount taxRate taxType cgstRate sgstRate cgstAmount sgstAmount vatAmount vatRate vatType foodSubtotal liquorSubtotal orderType restaurantId tableId customerName customerPhone isPaymentGatewayAllocated createdAt')
            .populate(this.orderRelationPopulate);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async updateStatus(id, dto) {
        const order = await this.orderModel.findByIdAndUpdate(id, { status: dto.status }, { new: true });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async updatePaymentStatus(id, dto) {
        const order = await this.orderModel.findByIdAndUpdate(id, { paymentStatus: dto.paymentStatus }, { new: true });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
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
    async getStats(restaurantId, datePreset) {
        const match = {};
        if (restaurantId) {
            match.restaurantId = this.toObjectId(restaurantId, 'restaurantId');
        }
        const range = (0, date_range_1.getDateRangeFromPreset)(datePreset);
        if (range) {
            match.createdAt = { $gte: range.from, $lte: range.to };
        }
        return this.getStatsWithMatch(match);
    }
    async getStatsByAll(datePreset) {
        const match = {};
        const range = (0, date_range_1.getDateRangeFromPreset)(datePreset);
        if (range) {
            match.createdAt = { $gte: range.from, $lte: range.to };
        }
        return this.getStatsWithMatch(match);
    }
    async getStatsByOrganization(organizationId, datePreset) {
        const organizationObjectId = this.toObjectId(organizationId, 'organizationId');
        const orgRestaurants = await this.restaurantModel
            .find({ organizationId: organizationObjectId })
            .select('_id')
            .exec();
        const restaurantIds = orgRestaurants.map((r) => r._id);
        const match = { restaurantId: { $in: restaurantIds } };
        const range = (0, date_range_1.getDateRangeFromPreset)(datePreset);
        if (range) {
            match.createdAt = { $gte: range.from, $lte: range.to };
        }
        return this.getStatsWithMatch(match);
    }
    async getStatsWithMatch(match) {
        const [totals] = await this.orderModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSales: { $sum: '$totalAmount' },
                },
            },
        ]);
        const mostSoldItems = await this.orderModel.aggregate([
            { $match: match },
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
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const revenueDaily = await this.orderModel.aggregate([
            { $match: { ...match, createdAt: { $gte: thirtyDaysAgo } } },
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
            { $match: { ...match, createdAt: { $gte: twelveWeeksAgo } } },
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
            { $match: { ...match, createdAt: { $gte: twelveMonthsAgo } } },
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
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        return {
            totalOrders: totals?.totalOrders || 0,
            totalSales: totals?.totalSales || 0,
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
        payments_service_1.PaymentsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map