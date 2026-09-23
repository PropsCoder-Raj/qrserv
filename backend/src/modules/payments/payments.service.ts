import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import {
  Payment,
  PaymentDocument,
  PaymentSchemaStatus,
} from '../../schemas/payment.schema';
import {
  Order,
  OrderDocument,
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
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private razorpay: any;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private configService: ConfigService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Razorpay = require('razorpay');
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('razorpay.keyId'),
      key_secret: this.configService.get<string>('razorpay.keySecret'),
    });
  }

  private async isPaymentGatewayAllocatedForOrder(order: any) {
    if (!order?.restaurantId) return false;

    const restaurant = await this.restaurantModel
      .findById(order.restaurantId)
      .select('organizationId')
      .lean();
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

  async createOrderForOrder(order: any) {
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
      status: PaymentSchemaStatus.CREATED,
    });

    await this.orderModel.findByIdAndUpdate(order._id, {
      paymentStatus: PaymentStatus.PENDING,
      isPaymentGatewayAllocated: true,
      razorpayOrderId: razorpayOrder.id,
    });

    return {
      paymentId: payment._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: this.configService.get<string>('razorpay.keyId'),
    };
  }

  async createOrder(dto: CreatePaymentOrderDto) {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    const isPaymentGatewayAllocated =
      await this.isPaymentGatewayAllocatedForOrder(order);
    if (!isPaymentGatewayAllocated) {
      throw new BadRequestException(
        'Online payment is disabled for this restaurant subscription plan',
      );
    }

    return this.createOrderForOrder(order);
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const secret = this.configService.get<string>('razorpay.keySecret');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const payment = await this.paymentModel.findOneAndUpdate(
      { razorpayOrderId: dto.razorpayOrderId },
      {
        razorpayPaymentId: dto.razorpayPaymentId,
        razorpaySignature: dto.razorpaySignature,
        status: PaymentSchemaStatus.CAPTURED,
      },
      { new: true },
    );

    if (!payment) throw new NotFoundException('Payment not found');

    await this.orderModel.findByIdAndUpdate(payment.orderId, {
      paymentStatus: PaymentStatus.PAID,
      paymentId: dto.razorpayPaymentId,
      razorpayPaymentId: dto.razorpayPaymentId,
    });

    return { message: 'Payment verified successfully', payment };
  }

  async handleWebhook(body: any) {
    const event = body.event;

    if (event === 'payment.captured') {
      const razorpayPaymentId = body.payload.payment.entity.id;
      const razorpayOrderId = body.payload.payment.entity.order_id;

      await this.paymentModel.findOneAndUpdate(
        { razorpayOrderId },
        {
          razorpayPaymentId,
          status: PaymentSchemaStatus.CAPTURED,
        },
      );

      const payment = await this.paymentModel.findOne({ razorpayOrderId });
      if (payment) {
        await this.orderModel.findByIdAndUpdate(payment.orderId, {
          paymentStatus: PaymentStatus.PAID,
          paymentId: razorpayPaymentId,
          razorpayPaymentId,
        });
      }
    }

    if (event === 'payment.failed') {
      const razorpayOrderId = body.payload.payment.entity.order_id;

      await this.paymentModel.findOneAndUpdate(
        { razorpayOrderId },
        { status: PaymentSchemaStatus.FAILED },
      );

      const payment = await this.paymentModel.findOne({ razorpayOrderId });
      if (payment) {
        await this.orderModel.findByIdAndUpdate(payment.orderId, {
          paymentStatus: PaymentStatus.FAILED,
        });
      }
    }

    return { status: 'ok' };
  }
}
