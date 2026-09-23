declare const _default: () => {
    port: number;
    mongodb: {
        uri: string;
    };
    apiKeys: {
        default: string;
        subscriptionPlans: string;
    };
    jwt: {
        secret: string;
        expiration: string;
        refreshSecret: string;
        refreshExpiration: string;
    };
    razorpay: {
        keyId: string;
        keySecret: string;
        webhookSecret: string;
    };
    withdraw: {
        chargePercentage: number;
        chargeGstPercentage: number;
    };
    mail: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string;
        to: string;
        subjectPrefix: string;
    };
};
export default _default;
