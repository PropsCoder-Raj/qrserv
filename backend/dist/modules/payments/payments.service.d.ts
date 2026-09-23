import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { OrderDocument } from '../../schemas/order.schema';
import { RestaurantDocument } from '../../schemas/restaurant.schema';
import { OrganizationDocument } from '../../schemas/organization.schema';
import { SubscriptionDocument } from '../../schemas/subscription.schema';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsService {
    private paymentModel;
    private orderModel;
    private restaurantModel;
    private organizationModel;
    private subscriptionModel;
    private configService;
    private razorpay;
    constructor(paymentModel: Model<PaymentDocument>, orderModel: Model<OrderDocument>, restaurantModel: Model<RestaurantDocument>, organizationModel: Model<OrganizationDocument>, subscriptionModel: Model<SubscriptionDocument>, configService: ConfigService);
    private isPaymentGatewayAllocatedForOrder;
    createOrderForOrder(order: any): Promise<{
        paymentId: import("mongoose").Types.ObjectId;
        razorpayOrderId: any;
        amount: any;
        currency: any;
        keyId: string;
    }>;
    createOrder(dto: CreatePaymentOrderDto): Promise<{
        paymentId: import("mongoose").Types.ObjectId;
        razorpayOrderId: any;
        amount: any;
        currency: any;
        keyId: string;
    }>;
    verifyPayment(dto: VerifyPaymentDto): Promise<{
        message: string;
        payment: import("mongoose").Document<unknown, {}, PaymentDocument, {}, import("mongoose").DefaultSchemaOptions> & Payment & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    handleWebhook(body: any): Promise<{
        status: string;
    }>;
}
