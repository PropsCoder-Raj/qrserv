import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createOrder(dto: CreatePaymentOrderDto): Promise<{
        paymentId: import("mongoose").Types.ObjectId;
        razorpayOrderId: any;
        amount: any;
        currency: any;
        keyId: string;
    }>;
    verifyPayment(dto: VerifyPaymentDto): Promise<{
        message: string;
        payment: import("mongoose").Document<unknown, {}, import("../../schemas").PaymentDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Payment & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    webhook(body: any): Promise<{
        status: string;
    }>;
}
