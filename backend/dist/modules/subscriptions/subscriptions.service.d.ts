import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../../schemas/subscription.schema';
import { Organization, OrganizationDocument } from '../../schemas/organization.schema';
import { SubscriptionHistory, SubscriptionHistoryDocument } from '../../schemas/subscription-history.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class SubscriptionsService {
    private subscriptionModel;
    private organizationModel;
    private subscriptionHistoryModel;
    private configService;
    private razorpay;
    private readonly FIRST_PURCHASE_TRIAL_DAYS;
    private getTrialDaysForOrg;
    private addDays;
    private normalizeMonths;
    private addMonths;
    private calculateDiscountedAmount;
    private normalizeOffers;
    private getOfferPercentForMonths;
    private applyPercentDiscount;
    private getMaxOfferPercent;
    private calculatePayableAmount;
    private ensureRazorpayPlanForSubscription;
    private verifyRazorpayWebhookSignature;
    private normalizeRazorpayWebhookBody;
    constructor(subscriptionModel: Model<SubscriptionDocument>, organizationModel: Model<OrganizationDocument>, subscriptionHistoryModel: Model<SubscriptionHistoryDocument>, configService: ConfigService);
    create(dto: CreateSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(query?: PaginationQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
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
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, dto: UpdateSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    assignToOrganization(dto: AssignSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAllPlans(): Promise<any[]>;
    purchaseSubscription(subscriptionId: string, months: number | undefined, autoPay: boolean | undefined, organizationId: string, userId: string): Promise<{
        message: string;
        subscription: import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        expiresAt: Date;
        history: import("mongoose").Document<unknown, {}, SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & SubscriptionHistory & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    createSubscriptionOrder(subscriptionId: string, months: number | undefined, autoPay: boolean | undefined, organizationId: string): Promise<{
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
    verifySubscriptionPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, subscriptionId: string, months: number | undefined, autoPay: boolean | undefined, organizationId: string, userId: string): Promise<{
        message: string;
        subscription: import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        expiresAt: Date;
        history: import("mongoose").Document<unknown, {}, SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & SubscriptionHistory & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    getAllSubscriptionHistory(query?: PaginationQueryDto): Promise<{
        records: (import("mongoose").Document<unknown, {}, SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & SubscriptionHistory & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
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
    getSubscriptionHistory(organizationId: string): Promise<{
        records: (import("mongoose").Document<unknown, {}, SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & SubscriptionHistory & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        totalPurchases: number;
        totalSpent: number;
    }>;
    getActiveSubscriptionPlan(organizationId: string): Promise<import("mongoose").Document<unknown, {}, SubscriptionHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & SubscriptionHistory & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    setAutoPayEnabled(organizationId: string, enabled: boolean): Promise<{
        message: string;
        organization: import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    createAutopaySubscription(subscriptionId: string, months: number | undefined, organizationId: string, userId: string): Promise<{
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
    handleWebhook(body: any, signature: string, rawBody?: string): Promise<{
        status: string;
    }>;
}
