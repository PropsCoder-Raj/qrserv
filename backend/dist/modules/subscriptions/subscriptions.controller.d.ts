import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { VerifySubscriptionPaymentDto } from './dto/verify-subscription-payment.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';
import { CreateAutopaySubscriptionDto } from './dto/create-autopay-subscription.dto';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    create(dto: CreateSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(query?: PaginationQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findAllPlans(): Promise<any[]>;
    findAllPlansWithApiKey(): Promise<any[]>;
    purchase(dto: PurchaseSubscriptionDto, user: any, organizationId: string, userId: string): Promise<{
        message: string;
        subscription: import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        expiresAt: Date;
        history: import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").SubscriptionHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    createSubscriptionOrder(dto: PurchaseSubscriptionDto, organizationId: string): Promise<{
        razorpayOrderId: any;
        amount: any;
        currency: any;
        keyId: string;
        plan: {
            name: string;
            price: number;
            payableAmount: number;
            duration: number;
            months: number;
            offerPercent: number;
            discountType: "none" | "flat" | "percentage";
            discountValue: number;
        };
    }>;
    createAutopaySubscription(dto: CreateAutopaySubscriptionDto, organizationId: string, userId: string): Promise<{
        razorpaySubscriptionId: any;
        status: any;
        shortUrl: any;
        keyId: string;
        subscription: {
            id: any;
            planId: any;
            planName: string;
            monthlyAmount: number;
        };
        pricing: {
            selectedMonths: number;
            calculatedPayableAmount: number;
        };
    }>;
    verifySubscriptionPayment(user: any, dto: VerifySubscriptionPaymentDto, organizationId: string, userId: string): Promise<{
        message: string;
        subscription: import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        expiresAt: Date;
        history: import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").SubscriptionHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    getMyHistory(organizationId: string): Promise<{
        records: (import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").SubscriptionHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        totalPurchases: number;
        totalSpent: number;
    }>;
    getMyActivePlan(organizationId: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").SubscriptionHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    setMyAutoPay(organizationId: string, enabled: boolean): Promise<{
        message: string;
        organization: import("mongoose").Document<unknown, {}, import("../../schemas").OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Organization & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    webhook(req: any, body: any): Promise<{
        status: string;
    }>;
    getAllHistory(query: PaginationQueryDto): Promise<{
        records: (import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").SubscriptionHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        summary: any;
    }>;
    getPlanAnalytics(): Promise<{
        plans: any[];
        summary: {
            totalPlans: number;
            totalActiveSubscriptions: any;
            totalPurchases: any;
        };
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, dto: UpdateSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    assign(dto: AssignSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Organization & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
