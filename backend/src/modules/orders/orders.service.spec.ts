import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../../schemas/order.schema';
import { Role } from '../../common/decorators';

describe('OrdersService - remove', () => {
  const orgId = new Types.ObjectId();
  const restaurantId = new Types.ObjectId();
  const otherRestaurantId = new Types.ObjectId();

  const mockOrder = {
    _id: new Types.ObjectId(),
    orderNumber: 'ORD-1001',
    status: OrderStatus.CANCELLED,
    restaurantId,
    totalAmount: 15.0,
    items: [],
  };

  const createService = (overrides?: {
    order?: any;
    restaurant?: any;
  }) => {
    const orderData = overrides?.order !== undefined ? overrides.order : { ...mockOrder };

    const orderModel = {
      findById: jest.fn().mockResolvedValue(orderData),
      findByIdAndDelete: jest.fn().mockResolvedValue(orderData),
    };

    const restaurantModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(
          overrides?.restaurant !== undefined
            ? overrides.restaurant
            : { _id: restaurantId, organizationId: orgId },
        ),
      }),
    };

    const paymentModel = {
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    const couponsService = {
      revertUsage: jest.fn().mockResolvedValue(undefined),
    };

    const organizationModel = {};
    const subscriptionModel = {};
    const tableModel = {};
    const paymentsService = {};
    const eventEmitter = { emit: jest.fn() };
    const orderStatisticsService = {};

    const service = new OrdersService(
      orderModel as any,
      restaurantModel as any,
      organizationModel as any,
      subscriptionModel as any,
      paymentModel as any,
      tableModel as any,
      paymentsService as any,
      eventEmitter as any,
      orderStatisticsService as any,
      couponsService as any,
    );

    return {
      service,
      orderModel,
      restaurantModel,
      paymentModel,
      couponsService,
    };
  };

  it('allows super_admin to delete a cancelled order and cascades linked records', async () => {
    const { service, orderModel, paymentModel, couponsService } = createService();

    const result = await service.remove(
      mockOrder._id.toString(),
      Role.SUPER_ADMIN,
    );

    expect(result.success).toBe(true);
    expect(paymentModel.deleteMany).toHaveBeenCalledWith({ orderId: mockOrder._id });
    expect(couponsService.revertUsage).toHaveBeenCalledWith(mockOrder._id);
    expect(orderModel.findByIdAndDelete).toHaveBeenCalledWith(mockOrder._id);
  });

  it('allows org_admin to delete a cancelled order belonging to their organization', async () => {
    const { service, orderModel } = createService();

    const result = await service.remove(
      mockOrder._id.toString(),
      Role.ORG_ADMIN,
      orgId.toString(),
    );

    expect(result.success).toBe(true);
    expect(orderModel.findByIdAndDelete).toHaveBeenCalledWith(mockOrder._id);
  });

  it('allows captain to delete a cancelled order belonging to their restaurant', async () => {
    const { service, orderModel } = createService();

    const result = await service.remove(
      mockOrder._id.toString(),
      Role.CAPTAIN,
      undefined,
      restaurantId.toString(),
    );

    expect(result.success).toBe(true);
    expect(orderModel.findByIdAndDelete).toHaveBeenCalledWith(mockOrder._id);
  });

  it('allows manager to delete a cancelled order belonging to their restaurant', async () => {
    const { service, orderModel } = createService();

    const result = await service.remove(
      mockOrder._id.toString(),
      Role.MANAGER,
      undefined,
      restaurantId.toString(),
    );

    expect(result.success).toBe(true);
    expect(orderModel.findByIdAndDelete).toHaveBeenCalledWith(mockOrder._id);
  });

  it('rejects deletion if order status is not cancelled (e.g. pending or served)', async () => {
    const { service } = createService({
      order: { ...mockOrder, status: OrderStatus.PENDING },
    });

    await expect(
      service.remove(mockOrder._id.toString(), Role.SUPER_ADMIN),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects deletion if user role is not authorized (e.g. kitchen or staff)', async () => {
    const { service } = createService();

    await expect(
      service.remove(
        mockOrder._id.toString(),
        Role.KITCHEN,
        undefined,
        restaurantId.toString(),
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.remove(
        mockOrder._id.toString(),
        Role.STAFF,
        undefined,
        restaurantId.toString(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects deletion if org_admin attempts to delete an order from a different organization', async () => {
    const differentOrgId = new Types.ObjectId();
    const { service } = createService({
      restaurant: { _id: restaurantId, organizationId: differentOrgId },
    });

    await expect(
      service.remove(
        mockOrder._id.toString(),
        Role.ORG_ADMIN,
        orgId.toString(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects deletion if manager attempts to delete an order from a different restaurant', async () => {
    const { service } = createService();

    await expect(
      service.remove(
        mockOrder._id.toString(),
        Role.MANAGER,
        undefined,
        otherRestaurantId.toString(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects deletion if order is not found', async () => {
    const { service } = createService({ order: null });

    await expect(
      service.remove(new Types.ObjectId().toString(), Role.SUPER_ADMIN),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects deletion if orderId is invalid', async () => {
    const { service } = createService();

    await expect(
      service.remove('invalid-id', Role.SUPER_ADMIN),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService - manual discount calculation', () => {
  const createService = () => {
    const orderModel = {};
    const restaurantModel = {};
    const organizationModel = {};
    const subscriptionModel = {};
    const paymentModel = {};
    const tableModel = {};
    const paymentsService = {};
    const eventEmitter = { emit: jest.fn() };
    const orderStatisticsService = {};
    const couponsService = {};

    const service = new OrdersService(
      orderModel as any,
      restaurantModel as any,
      organizationModel as any,
      subscriptionModel as any,
      paymentModel as any,
      tableModel as any,
      paymentsService as any,
      eventEmitter as any,
      orderStatisticsService as any,
      couponsService as any,
    );

    return { service };
  };

  it('calculates percentage manual discount correctly', () => {
    const { service } = createService();
    const result = (service as any).calculateManualDiscount(
      'PERCENTAGE',
      10,
      'Courtesy',
      1000,
      0,
    );

    expect(result).toEqual({
      manualDiscountType: 'PERCENTAGE',
      manualDiscountValue: 10,
      manualDiscountAmount: 100,
      manualDiscountReason: 'Courtesy',
    });
  });

  it('calculates fixed manual discount correctly', () => {
    const { service } = createService();
    const result = (service as any).calculateManualDiscount(
      'FIXED',
      150.5,
      'Manager override',
      1000,
      0,
    );

    expect(result).toEqual({
      manualDiscountType: 'FIXED',
      manualDiscountValue: 150.5,
      manualDiscountAmount: 150.5,
      manualDiscountReason: 'Manager override',
    });
  });

  it('throws BadRequestException if percentage > 100', () => {
    const { service } = createService();
    expect(() =>
      (service as any).calculateManualDiscount('PERCENTAGE', 105, '', 1000, 0),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException if fixed discount > order subtotal', () => {
    const { service } = createService();
    expect(() =>
      (service as any).calculateManualDiscount('FIXED', 1200, '', 1000, 0),
    ).toThrow(BadRequestException);
  });

  it('caps manual discount when stacking with coupon so total discount does not exceed subtotal', () => {
    const { service } = createService();
    // Subtotal: 1000, coupon discount: 950. Manual discount 10% (100).
    // Remaining subtotal is 50, so manual discount is capped at 50.
    const result = (service as any).calculateManualDiscount(
      'PERCENTAGE',
      10,
      '',
      1000,
      950,
    );

    expect(result.manualDiscountAmount).toBe(50);
  });

  it('handles null/empty manual discount gracefully', () => {
    const { service } = createService();
    const result = (service as any).calculateManualDiscount(null, 0, '', 1000, 0);

    expect(result).toEqual({
      manualDiscountType: null,
      manualDiscountValue: 0,
      manualDiscountAmount: 0,
      manualDiscountReason: '',
    });
  });
});

describe('OrdersService - getInvoice', () => {
  it('returns invoice payload with populated restaurant details including cr_number and receipt_header_note', async () => {
    const orderId = new Types.ObjectId().toString();
    const mockInvoiceOrder = {
      _id: new Types.ObjectId(orderId),
      orderNumber: 'ORD-10243',
      restaurantId: {
        _id: new Types.ObjectId(),
        name: 'Grand Dubai Restaurant',
        cr_number: '1002345678',
        receipt_header_note: 'TRN: 100203040500003 | Authentic Cuisine',
      },
      items: [{ name: 'Dish 1', price: 10, quantity: 1 }],
      totalAmount: 10,
    };

    const orderModel = {
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvoiceOrder),
      }),
    };

    const service = new OrdersService(
      orderModel as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result: any = await service.getInvoice(orderId);

    expect(result).toBeDefined();
    expect(result.orderNumber).toBe('ORD-10243');
    expect(result.restaurantId.cr_number).toBe('1002345678');
    expect(result.restaurantId.receipt_header_note).toBe(
      'TRN: 100203040500003 | Authentic Cuisine',
    );
  });
});

