export declare class VerifySubscriptionPaymentDto {
    subscriptionId: string;
    months?: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    autoPay?: boolean;
}
