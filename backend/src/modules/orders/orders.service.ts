import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderItemStatus,
  OrderStatus,
  PaymentStatus,
} from '../../schemas/order.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import {
  Organization,
  OrganizationDocument,
} from '../../schemas/organization.schema';
import {
  Subscription,
  SubscriptionDocument,
} from '../../schemas/subscription.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { CancelOrderItemDto } from './dto/cancel-order-item.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  getDateRangeFromPreset,
  getDateRangeFromQuery,
} from '../../common/utils/date-range';
import { DatePreset } from '../../common/dto/date-filter.dto';
import { PaymentsService } from '../payments/payments.service';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { Table, TableDocument } from '../../schemas/table.schema';

@Injectable()
export class OrdersService {
  private readonly orderRelationPopulate: PopulateOptions[] = [
    {
      path: 'restaurantId',
      select:
        'name slug owner_name restaurant_type description logo address phone email gst_no vat_no taxEnabled taxRate taxType vatEnabled vatRate vatType isActive menuPdf organizationId',
    },
    {
      path: 'tableId',
      select: 'tableNumber capacity restaurantId qrCode isActive',
    },
  ];

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    @InjectModel(Table.name)
    private tableModel: Model<TableDocument>,
    private paymentsService: PaymentsService,
  ) {}

  private toObjectId(
    value: string | Types.ObjectId | null | undefined,
    fieldName: string,
  ) {
    if (!value) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    if (value instanceof Types.ObjectId) {
      return value;
    }

    const valueString = value.toString();
    if (!Types.ObjectId.isValid(valueString)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return new Types.ObjectId(valueString);
  }

  async validateOrgRestaurant(
    restaurantId: string | Types.ObjectId,
    organizationId: string | Types.ObjectId,
  ) {
    const restaurantObjectId = this.toObjectId(restaurantId, 'restaurantId');
    const organizationObjectId = this.toObjectId(
      organizationId,
      'organizationId',
    );
    const restaurant = await this.restaurantModel
      .findById(restaurantObjectId)
      .select('organizationId');
    if (
      !restaurant ||
      !restaurant.organizationId?.equals(organizationObjectId)
    ) {
      throw new ForbiddenException(
        'Restaurant does not belong to your organization',
      );
    }
  }

  private async generateOrderNumber(
    restaurantId: string | Types.ObjectId,
  ): Promise<string> {
    const restaurantObjectId =
      restaurantId instanceof Types.ObjectId
        ? restaurantId
        : new Types.ObjectId(restaurantId);
    const restaurantIdString = restaurantObjectId.toString();
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

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

    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const restaurantPart = restaurantIdString.slice(-4).toUpperCase();
    const sequencePart = String(nextSequence).padStart(5, '0');

    return `ORD-${datePart}-${restaurantPart}-${sequencePart}`;
  }

  private async isPaymentGatewayAllocatedForRestaurant(restaurant: any) {
    if (!restaurant?.organizationId) return false;

    const organization = await this.organizationModel
      .findById(restaurant.organizationId)
      .select('subscriptionPlan subscriptionExpiry')
      .lean();
    if (!organization?.subscriptionPlan) return false;

    if (
      organization.subscriptionExpiry &&
      new Date(organization.subscriptionExpiry) < new Date()
    ) {
      return false;
    }

    const subscription = await this.subscriptionModel
      .findById(organization.subscriptionPlan)
      .select('isPaymentGatewayAllocated')
      .lean();

    return Boolean(subscription?.isPaymentGatewayAllocated);
  }

  async create(dto: CreateOrderDto) {
    if (!Types.ObjectId.isValid(dto.restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }

    const tableId = typeof dto.tableId === 'string' ? dto.tableId.trim() : '';
    if (tableId && !Types.ObjectId.isValid(tableId)) {
      throw new BadRequestException('Invalid tableId');
    }

    for (const item of dto.items || []) {
      if (!Types.ObjectId.isValid(item.menuItemId)) {
        throw new BadRequestException('Invalid menuItemId');
      }
    }

    const restaurant = await this.restaurantModel.findById(dto.restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const isPaymentGatewayAllocated =
      await this.isPaymentGatewayAllocatedForRestaurant(restaurant);

    // Separate items into food and liquor groups
    const foodItems = dto.items.filter(
      (i) => (i.itemType || 'food') === 'food',
    );
    const liquorItems = dto.items.filter(
      (i) => (i.itemType || 'food') === 'liquor',
    );

    const foodTotal = foodItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    const liquorTotal = liquorItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

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

    // Food items — GST (CGST + SGST)
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
      } else {
        foodBase = foodTotal;
        cgstAmount = Math.round(((foodBase * cgstRate) / 100) * 100) / 100;
        sgstAmount = Math.round(((foodBase * sgstRate) / 100) * 100) / 100;
      }
    } else if (restaurant?.taxEnabled) {
      taxRate = restaurant.taxRate;
      taxType = restaurant.taxType || 'inclusive';
    }

    // Liquor items — VAT (single tax)
    if (restaurant?.vatEnabled && restaurant.vatRate > 0 && liquorTotal > 0) {
      vatRate = restaurant.vatRate;
      vatType = restaurant.vatType || 'inclusive';

      if (vatType === 'inclusive') {
        liquorBase =
          Math.round((liquorTotal / (1 + vatRate / 100)) * 100) / 100;
        vatAmount = Math.round((liquorTotal - liquorBase) * 100) / 100;
      } else {
        liquorBase = liquorTotal;
        vatAmount = Math.round(((liquorBase * vatRate) / 100) * 100) / 100;
      }
    } else if (restaurant?.vatEnabled) {
      vatRate = restaurant.vatRate;
      vatType = restaurant.vatType || 'inclusive';
    }

    // Combined totals
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

    const restaurantObjectId = new Types.ObjectId(dto.restaurantId);
    const tableObjectId = tableId ? new Types.ObjectId(tableId) : null;
    if (tableObjectId) {
      const table = await this.tableModel
        .findById(tableObjectId)
        .select('restaurantId isActive')
        .lean();
      if (!table || !table.isActive) {
        throw new BadRequestException('Invalid tableId');
      }
      if (table.restaurantId?.toString() !== restaurantObjectId.toString()) {
        throw new BadRequestException(
          'Selected table does not belong to this restaurant',
        );
      }

      const existingActiveOrder = await this.orderModel
        .findOne({
          tableId: tableObjectId,
          status: { $ne: OrderStatus.CANCELLED },
          $nor: [
            {
              status: OrderStatus.SERVED,
              paymentStatus: PaymentStatus.PAID,
            },
          ],
        })
        .select('orderNumber status paymentStatus')
        .lean();

      if (existingActiveOrder) {
        throw new BadRequestException(
          'This table is currently engaged. Complete payment or cancel the active order before placing a new order.',
        );
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
          menuItemId: new Types.ObjectId(i.menuItemId),
          status: OrderItemStatus.ACTIVE,
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
        status: OrderStatus.PENDING,
        isPaymentGatewayAllocated,
      });
    } catch (err: any) {
      if (err?.code !== 11000 || !err?.keyPattern?.orderNumber) {
        throw err;
      }

      return this.orderModel.create({
        ...orderDto,
        restaurantId: restaurantObjectId,
        tableId: tableObjectId,
        items: (dto.items || []).map((i) => ({
          ...i,
          menuItemId: new Types.ObjectId(i.menuItemId),
          status: OrderItemStatus.ACTIVE,
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
        status: OrderStatus.PENDING,
        isPaymentGatewayAllocated,
      });
    }
  }

  async createForCustomerApp(dto: CreateOrderDto) {
    const order = await this.create(dto);

    if (
      order.tableId ||
      !order?.isPaymentGatewayAllocated ||
      order.paymentMethod !== 'online'
    ) {
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

  async rollbackFailedCustomerOrder(orderId: string, razorpayOrderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      return { message: 'Order already removed' };
    }

    if (!order.isPaymentGatewayAllocated) {
      throw new BadRequestException('Rollback is only allowed for paid orders');
    }
    if (order.paymentStatus === 'paid') {
      throw new BadRequestException(
        'Cannot rollback an order with successful payment',
      );
    }
    if (order.razorpayOrderId !== razorpayOrderId) {
      throw new BadRequestException('Invalid rollback request');
    }

    await this.paymentModel.deleteMany({ orderId: order._id });
    await this.orderModel.findByIdAndDelete(orderId);

    return { message: 'Failed payment order removed successfully' };
  }

  async updateCustomerTableOrderItems(id: string, items: OrderItemDto[]) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid orderId');
    }
    if (!items?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    for (const item of items) {
      if (!Types.ObjectId.isValid(item.menuItemId)) {
        throw new BadRequestException('Invalid menuItemId');
      }
      if (Number(item.quantity) <= 0) {
        throw new BadRequestException('Item quantity must be greater than 0');
      }
    }

    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    if (!order.tableId) {
      throw new BadRequestException('Only table orders can be updated');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Paid orders cannot be updated');
    }
    if ([OrderStatus.CANCELLED, OrderStatus.SERVED].includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be updated when status is '${order.status}'`,
      );
    }

    const restaurant = await this.restaurantModel.findById(order.restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const normalizedItems = items.map((item) => ({
      menuItemId: new Types.ObjectId(item.menuItemId),
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      itemType: item.itemType || 'food',
      status: OrderItemStatus.ACTIVE,
      cancelledQuantity: 0,
      cancelReason: '',
    }));
    const totals = this.computeTotalsForItems(restaurant, normalizedItems);

    order.items = normalizedItems as any;
    (order as any).subtotalAmount = totals.subtotalAmount;
    (order as any).taxAmount = totals.taxAmount;
    (order as any).taxRate = totals.taxRate;
    (order as any).taxType = totals.taxType;
    (order as any).cgstRate = totals.cgstRate;
    (order as any).sgstRate = totals.sgstRate;
    (order as any).cgstAmount = totals.cgstAmount;
    (order as any).sgstAmount = totals.sgstAmount;
    (order as any).vatAmount = totals.vatAmount;
    (order as any).vatRate = totals.vatRate;
    (order as any).vatType = totals.vatType;
    (order as any).foodSubtotal = totals.foodSubtotal;
    (order as any).liquorSubtotal = totals.liquorSubtotal;
    (order as any).totalAmount = totals.totalAmount;
    if (order.razorpayOrderId) {
      await this.paymentModel.deleteMany({ orderId: order._id });
      order.razorpayOrderId = '';
      order.razorpayPaymentId = '';
      order.paymentId = '';
      order.paymentStatus = PaymentStatus.PENDING;
    }

    await order.save();
    return this.getStatus(id);
  }

  private computeTotalsForItems(
    restaurant: any,
    items: Array<{ price: number; quantity: number; itemType?: string }>,
  ) {
    // Separate items into food and liquor groups
    const foodItems = items.filter((i) => (i.itemType || 'food') === 'food');
    const liquorItems = items.filter(
      (i) => (i.itemType || 'food') === 'liquor',
    );

    const foodTotal = foodItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    const liquorTotal = liquorItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

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

    // Food items — GST (CGST + SGST)
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
      } else {
        foodBase = foodTotal;
        cgstAmount = Math.round(((foodBase * cgstRate) / 100) * 100) / 100;
        sgstAmount = Math.round(((foodBase * sgstRate) / 100) * 100) / 100;
      }
    } else if (restaurant?.taxEnabled) {
      taxRate = restaurant.taxRate;
      taxType = restaurant.taxType || 'inclusive';
    }

    // Liquor items — VAT (single tax)
    if (restaurant?.vatEnabled && restaurant.vatRate > 0 && liquorTotal > 0) {
      vatRate = restaurant.vatRate;
      vatType = restaurant.vatType || 'inclusive';

      if (vatType === 'inclusive') {
        liquorBase =
          Math.round((liquorTotal / (1 + vatRate / 100)) * 100) / 100;
        vatAmount = Math.round((liquorTotal - liquorBase) * 100) / 100;
      } else {
        liquorBase = liquorTotal;
        vatAmount = Math.round(((liquorBase * vatRate) / 100) * 100) / 100;
      }
    } else if (restaurant?.vatEnabled) {
      vatRate = restaurant.vatRate;
      vatType = restaurant.vatType || 'inclusive';
    }

    // Combined totals
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

  async cancelOrderItem(id: string, dto: CancelOrderItemDto, userId: string) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    // Only allow until preparing (inclusive)
    if (
      ![
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
      ].includes(order.status)
    ) {
      throw new BadRequestException(
        `Item cancellation is not allowed when order is '${order.status}'`,
      );
    }

    const idx = dto.itemIndex;
    if (idx < 0 || idx >= (order.items || []).length) {
      throw new BadRequestException('Invalid itemIndex');
    }

    const item: any = order.items[idx];
    const totalQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    const remainingQty = totalQty - cancelledQty;

    if (remainingQty <= 0) {
      throw new BadRequestException('Item already fully cancelled');
    }

    if (dto.cancelQuantity > remainingQty) {
      throw new BadRequestException(
        `Cancel quantity cannot exceed remaining quantity (${remainingQty})`,
      );
    }

    item.cancelledQuantity = cancelledQty + dto.cancelQuantity;
    item.cancelReason = dto.reason;
    item.cancelledBy = new Types.ObjectId(userId);
    item.cancelledAt = new Date();
    item.status =
      item.cancelledQuantity >= totalQty
        ? OrderItemStatus.CANCELLED
        : OrderItemStatus.ACTIVE;

    // Recalculate totals based on ACTIVE remaining quantities
    const restaurant = await this.restaurantModel.findById(order.restaurantId);
    const effectiveItems = (order.items || [])
      .map((it: any) => {
        const qty = Number(it.quantity || 0);
        const cQty = Number(it.cancelledQuantity || 0);
        const effQty = Math.max(0, qty - cQty);
        return { ...it.toObject?.(), price: it.price, quantity: effQty };
      })
      .filter((it: any) => Number(it.quantity) > 0);

    const totals = this.computeTotalsForItems(restaurant, effectiveItems);
    (order as any).subtotalAmount = totals.subtotalAmount;
    (order as any).taxAmount = totals.taxAmount;
    (order as any).taxRate = totals.taxRate;
    (order as any).taxType = totals.taxType;
    (order as any).cgstRate = totals.cgstRate;
    (order as any).sgstRate = totals.sgstRate;
    (order as any).cgstAmount = totals.cgstAmount;
    (order as any).sgstAmount = totals.sgstAmount;
    (order as any).vatAmount = totals.vatAmount;
    (order as any).vatRate = totals.vatRate;
    (order as any).vatType = totals.vatType;
    (order as any).foodSubtotal = totals.foodSubtotal;
    (order as any).liquorSubtotal = totals.liquorSubtotal;
    (order as any).totalAmount = totals.totalAmount;

    // If all items fully cancelled, auto-cancel order
    const allCancelled = (order.items || []).every((it: any) => {
      const qty = Number(it.quantity || 0);
      const cQty = Number(it.cancelledQuantity || 0);
      return qty > 0 && cQty >= qty;
    });
    if (allCancelled) {
      order.status = OrderStatus.CANCELLED;
    }

    await order.save();
    return order;
  }

  async findAll(
    restaurantId?: string,
    status?: OrderStatus,
    query?: PaginationQueryDto,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
    } = query || {};
    const filter: any = {};
    if (restaurantId) {
      if (!Types.ObjectId.isValid(restaurantId)) {
        throw new BadRequestException('Invalid restaurantId');
      }
      filter.restaurantId = new Types.ObjectId(restaurantId);
    }
    if (query?.tableId) {
      if (!Types.ObjectId.isValid(query.tableId)) {
        throw new BadRequestException('Invalid tableId');
      }
      filter.tableId = new Types.ObjectId(query.tableId);
    }
    if (status) filter.status = status;

    const range = getDateRangeFromQuery(query);
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

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
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

  async findAllByOrganization(
    organizationId: string,
    status?: OrderStatus,
    query?: PaginationQueryDto,
  ) {
    const orgRestaurants = await this.restaurantModel
      .find({ organizationId })
      .select('_id')
      .exec();
    const restaurantIds = orgRestaurants.map((r) => r._id);

    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
    } = query || {};
    const filter: any = { restaurantId: { $in: restaurantIds } };
    if (query?.tableId) {
      if (!Types.ObjectId.isValid(query.tableId)) {
        throw new BadRequestException('Invalid tableId');
      }
      filter.tableId = new Types.ObjectId(query.tableId);
    }
    if (status) filter.status = status;

    const range = getDateRangeFromQuery(query);
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

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
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

  async findOne(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate(this.orderRelationPopulate);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getStatus(id: string) {
    const order = await this.orderModel
      .findById(id)
      .select(
        'orderNumber status paymentStatus paymentMethod items totalAmount subtotalAmount taxAmount taxRate taxType cgstRate sgstRate cgstAmount sgstAmount vatAmount vatRate vatType foodSubtotal liquorSubtotal orderType restaurantId tableId customerName customerPhone isPaymentGatewayAllocated createdAt',
      )
      .populate(this.orderRelationPopulate);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { status: dto.status },
      { new: true },
    );
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { paymentStatus: dto.paymentStatus },
      { new: true },
    );
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByRestaurant(restaurantId: string) {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }

    return this.orderModel
      .find({ restaurantId: new Types.ObjectId(restaurantId) })
      .populate(this.orderRelationPopulate)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPhone(phone: string) {
    return this.orderModel
      .find({ customerPhone: phone })
      .populate(this.orderRelationPopulate)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getStats(
    restaurantId?: string | Types.ObjectId,
    datePreset?: DatePreset,
  ) {
    const match: any = {};
    if (restaurantId) {
      match.restaurantId = this.toObjectId(restaurantId, 'restaurantId');
    }

    const range = getDateRangeFromPreset(datePreset);
    if (range) {
      match.createdAt = { $gte: range.from, $lte: range.to };
    }

    return this.getStatsWithMatch(match);
  }

  async getStatsByAll(datePreset?: any) {
    const match: any = {};
    const range = getDateRangeFromPreset(datePreset);
    if (range) {
      match.createdAt = { $gte: range.from, $lte: range.to };
    }
    return this.getStatsWithMatch(match);
  }

  async getStatsByOrganization(
    organizationId: string | Types.ObjectId,
    datePreset?: any,
  ) {
    const organizationObjectId = this.toObjectId(
      organizationId,
      'organizationId',
    );

    const orgRestaurants = await this.restaurantModel
      .find({ organizationId: organizationObjectId })
      .select('_id')
      .exec();
    const restaurantIds = orgRestaurants.map((r) => r._id);
    const match: any = { restaurantId: { $in: restaurantIds } };
    const range = getDateRangeFromPreset(datePreset);
    if (range) {
      match.createdAt = { $gte: range.from, $lte: range.to };
    }
    return this.getStatsWithMatch(match);
  }

  private async getStatsWithMatch(match: any) {
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
}
