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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = require("crypto");
const subscription_schema_1 = require("../../schemas/subscription.schema");
const organization_schema_1 = require("../../schemas/organization.schema");
const subscription_history_schema_1 = require("../../schemas/subscription-history.schema");
const date_range_1 = require("../../common/utils/date-range");
let SubscriptionsService = class SubscriptionsService {
    async getTrialDaysForOrg(organizationId) {
        const alreadyPurchased = await this.subscriptionHistoryModel.exists({
            organizationId,
        });
        return alreadyPurchased ? 0 : this.FIRST_PURCHASE_TRIAL_DAYS;
    }
    addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + (Number(days) || 0));
        return d;
    }
    normalizeMonths(months) {
        const m = Number(months);
        if (!m || Number.isNaN(m))
            return 1;
        if (!Number.isInteger(m) || m < 1) {
            throw new common_1.BadRequestException('Invalid months. Months must be >= 1');
        }
        return m;
    }
    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }
    calculateDiscountedAmount(price, discountType, discountValue) {
        const base = Number(price) || 0;
        const type = discountType || 'none';
        const value = Number(discountValue) || 0;
        if (base <= 0)
            return 0;
        if (type === 'none' || value <= 0)
            return base;
        if (type === 'flat') {
            return Math.max(0, base - value);
        }
        const pct = Math.min(100, Math.max(0, value));
        const discount = (base * pct) / 100;
        return Math.max(0, base - discount);
    }
    normalizeOffers(offers) {
        if (!offers)
            return [];
        if (!Array.isArray(offers)) {
            throw new common_1.BadRequestException('Offers must be an array');
        }
        const normalized = offers
            .map((o) => ({
            months: Number(o?.months),
            offerPercent: Number(o?.offerPercent),
        }))
            .filter((o) => !Number.isNaN(o.months) && !Number.isNaN(o.offerPercent));
        const map = new Map();
        for (const o of normalized) {
            if (!o.months || o.months < 1) {
                throw new common_1.BadRequestException('Offer months must be >= 1');
            }
            if (o.offerPercent < 0 || o.offerPercent > 100) {
                throw new common_1.BadRequestException('Offer percent must be between 0 and 100');
            }
            map.set(o.months, { months: o.months, offerPercent: o.offerPercent });
        }
        return Array.from(map.values()).sort((a, b) => a.months - b.months);
    }
    getOfferPercentForMonths(plan, months) {
        const offers = Array.isArray(plan?.offers) ? plan.offers : [];
        const row = offers.find((o) => Number(o?.months) === Number(months));
        const pct = Number(row?.offerPercent) || 0;
        return Math.min(100, Math.max(0, pct));
    }
    applyPercentDiscount(amount, percent) {
        const base = Number(amount) || 0;
        const pct = Math.min(100, Math.max(0, Number(percent) || 0));
        if (base <= 0 || pct <= 0)
            return base;
        return Math.max(0, base - (base * pct) / 100);
    }
    getMaxOfferPercent(plan) {
        const offers = Array.isArray(plan?.offers) ? plan.offers : [];
        if (!offers.length)
            return 0;
        return offers.reduce((max, offer) => {
            const pct = Math.min(100, Math.max(0, Number(offer?.offerPercent) || 0));
            return Math.max(max, pct);
        }, 0);
    }
    calculatePayableAmount(plan, months) {
        const baseAmount = (Number(plan?.price) || 0) * (Number(months) || 1);
        const offerPct = this.getOfferPercentForMonths(plan, months);
        const afterOffer = this.applyPercentDiscount(baseAmount, offerPct);
        const finalTotal = this.calculateDiscountedAmount(afterOffer, plan.discountType, plan.discountValue);
        return {
            baseAmount,
            offerPct,
            afterOffer,
            finalTotal,
        };
    }
    async ensureRazorpayPlanForSubscription(plan) {
        if (plan?.razorpayPlanId)
            return plan.razorpayPlanId;
        const amountInPaise = Math.round((Number(plan?.price) || 0) * 100);
        if (!amountInPaise || amountInPaise <= 0) {
            throw new common_1.BadRequestException('Auto-pay is only available for paid plans with price > 0');
        }
        let razorpayPlan;
        try {
            razorpayPlan = await this.razorpay.plans.create({
                period: 'monthly',
                interval: 1,
                item: {
                    name: `${plan.name} (Monthly)`,
                    amount: amountInPaise,
                    currency: 'INR',
                    description: `Auto-renewal monthly for ${plan.name}`,
                },
            });
        }
        catch (err) {
            const description = err?.error?.description ||
                err?.message ||
                'Razorpay plan creation failed';
            throw new common_1.BadRequestException(description);
        }
        await this.subscriptionModel.findByIdAndUpdate(plan._id, {
            razorpayPlanId: razorpayPlan.id,
        });
        return razorpayPlan.id;
    }
    verifyRazorpayWebhookSignature(payloadRaw, signature) {
        const secret = this.configService.get('razorpay.webhookSecret');
        if (!secret) {
            throw new common_1.BadRequestException('Razorpay webhook secret is not configured on server');
        }
        const expected = crypto
            .createHmac('sha256', secret)
            .update(payloadRaw)
            .digest('hex');
        return expected === signature;
    }
    normalizeRazorpayWebhookBody(body) {
        return JSON.stringify(body);
    }
    constructor(subscriptionModel, organizationModel, subscriptionHistoryModel, configService) {
        this.subscriptionModel = subscriptionModel;
        this.organizationModel = organizationModel;
        this.subscriptionHistoryModel = subscriptionHistoryModel;
        this.configService = configService;
        this.FIRST_PURCHASE_TRIAL_DAYS = 15;
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
            key_id: this.configService.get('razorpay.keyId'),
            key_secret: this.configService.get('razorpay.keySecret'),
        });
    }
    async create(dto) {
        const normalizedOffers = this.normalizeOffers(dto.offers);
        return this.subscriptionModel.create({
            ...dto,
            offers: normalizedOffers,
        });
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'asc', } = query || {};
        const filter = { isActive: true };
        if (search) {
            filter.$or = [{ name: { $regex: search, $options: 'i' } }];
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
            sort.name = 1;
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.subscriptionModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.subscriptionModel.countDocuments(filter).exec(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const sub = await this.subscriptionModel.findById(id);
        if (!sub)
            throw new common_1.NotFoundException('Subscription plan not found');
        return sub;
    }
    async update(id, dto) {
        const normalizedOffers = this.normalizeOffers(dto.offers);
        const updateDoc = { ...dto };
        if (dto.offers !== undefined) {
            updateDoc.offers = normalizedOffers;
        }
        const sub = await this.subscriptionModel.findByIdAndUpdate(id, updateDoc, {
            new: true,
        });
        if (!sub)
            throw new common_1.NotFoundException('Subscription plan not found');
        return sub;
    }
    async remove(id) {
        const sub = await this.subscriptionModel.findByIdAndDelete(id);
        if (!sub)
            throw new common_1.NotFoundException('Subscription plan not found');
        return { message: 'Subscription plan deleted' };
    }
    async assignToOrganization(dto) {
        const subscription = await this.subscriptionModel.findById(dto.subscriptionId);
        if (!subscription)
            throw new common_1.NotFoundException('Subscription not found');
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + subscription.duration);
        const organization = await this.organizationModel.findByIdAndUpdate(dto.organizationId, {
            subscriptionPlan: subscription._id,
            subscriptionExpiry: expiryDate,
        }, { new: true });
        if (!organization)
            throw new common_1.NotFoundException('Organization not found');
        return organization;
    }
    async findAllPlans() {
        const plans = await this.subscriptionModel
            .find({ isActive: true })
            .sort({ price: 1 })
            .lean()
            .exec();
        return plans.map((plan) => {
            const price = Number(plan?.price) || 0;
            const maxOfferPercent = this.getMaxOfferPercent(plan);
            const perMonthPriceAfterOffer = Number(this.applyPercentDiscount(price, maxOfferPercent).toFixed(2));
            return {
                ...plan,
                maxOfferPercent,
                perMonthPriceAfterOffer,
            };
        });
    }
    async purchaseSubscription(subscriptionId, months, autoPay, organizationId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(organizationId)) {
            throw new common_1.BadRequestException('Invalid organizationId');
        }
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid userId');
        }
        console.log('🚀 ~ SubscriptionsService ~ purchaseSubscription ~ userId:', userId);
        console.log('🚀 ~ SubscriptionsService ~ purchaseSubscription ~ organizationId:', organizationId);
        console.log('🚀 ~ SubscriptionsService ~ purchaseSubscription ~ subscriptionId:', subscriptionId);
        const plan = await this.subscriptionModel.findById(subscriptionId);
        if (!plan)
            throw new common_1.NotFoundException('Subscription plan not found');
        if (!plan.isActive)
            throw new common_1.BadRequestException('This plan is no longer available');
        await this.subscriptionHistoryModel.updateMany({
            organizationId,
            status: 'active',
            expiresAt: { $lt: new Date() },
        }, { status: 'expired' });
        const normalizedMonths = this.normalizeMonths(months);
        const now = new Date();
        const trialDays = await this.getTrialDaysForOrg(organizationId);
        const expiresAt = this.addDays(this.addMonths(now, normalizedMonths), trialDays);
        const organization = await this.organizationModel.findByIdAndUpdate(organizationId, {
            subscriptionPlan: plan._id,
            subscriptionExpiry: expiresAt,
            subscriptionAutoPayEnabled: Boolean(autoPay),
        }, { new: true });
        if (!organization)
            throw new common_1.NotFoundException('Organization not found');
        await this.subscriptionHistoryModel.updateMany({ organizationId, status: 'active' }, { status: 'expired' });
        const baseAmount = plan.price * normalizedMonths;
        const monthsOfferPct = this.getOfferPercentForMonths(plan, normalizedMonths);
        const offerDiscountedAmount = this.applyPercentDiscount(baseAmount, monthsOfferPct);
        const payableAmount = this.calculateDiscountedAmount(offerDiscountedAmount, plan.discountType, plan.discountValue);
        const history = await this.subscriptionHistoryModel.create({
            organizationId: new mongoose_2.Types.ObjectId(organizationId),
            subscriptionId: plan._id,
            planName: plan.name,
            price: payableAmount,
            duration: plan.duration * normalizedMonths + trialDays,
            trialDays,
            months: normalizedMonths,
            purchasedAt: now,
            expiresAt,
            purchasedBy: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
            paymentStatus: 'free',
        });
        return {
            message: 'Subscription purchased successfully',
            subscription: plan,
            expiresAt,
            history,
        };
    }
    async createSubscriptionOrder(subscriptionId, months, autoPay, organizationId) {
        const plan = await this.subscriptionModel.findById(subscriptionId);
        if (!plan)
            throw new common_1.NotFoundException('Subscription plan not found');
        if (!plan.isActive)
            throw new common_1.BadRequestException('This plan is no longer available');
        const normalizedMonths = this.normalizeMonths(months);
        const payableAmount = this.calculateDiscountedAmount(this.applyPercentDiscount(plan.price * normalizedMonths, this.getOfferPercentForMonths(plan, normalizedMonths)), plan.discountType, plan.discountValue);
        if (payableAmount === 0)
            throw new common_1.BadRequestException('Use the direct purchase endpoint for free plans');
        const receipt = `sub_${Date.now()}`;
        let razorpayOrder;
        try {
            razorpayOrder = await this.razorpay.orders.create({
                amount: Math.round(payableAmount * 100),
                currency: 'INR',
                receipt,
                notes: {
                    subscriptionId: subscriptionId.toString(),
                    organizationId: organizationId.toString(),
                    planName: plan.name,
                    months: normalizedMonths.toString(),
                    autoPay: Boolean(autoPay).toString(),
                },
            });
        }
        catch (err) {
            const description = err?.error?.description ||
                err?.message ||
                'Razorpay order creation failed';
            throw new common_1.BadRequestException(description);
        }
        return {
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: this.configService.get('razorpay.keyId'),
            plan: {
                name: plan.name,
                price: plan.price,
                payableAmount,
                duration: plan.duration * normalizedMonths,
                months: normalizedMonths,
                offerPercent: this.getOfferPercentForMonths(plan, normalizedMonths),
                discountType: plan.discountType,
                discountValue: plan.discountValue,
            },
        };
    }
    async verifySubscriptionPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, subscriptionId, months, autoPay, organizationId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(organizationId)) {
            throw new common_1.BadRequestException('Invalid organizationId');
        }
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid userId');
        }
        const secret = this.configService.get('razorpay.keySecret');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');
        if (expectedSignature !== razorpaySignature) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        const plan = await this.subscriptionModel.findById(subscriptionId);
        if (!plan)
            throw new common_1.NotFoundException('Subscription plan not found');
        const normalizedMonths = this.normalizeMonths(months);
        const payableAmount = this.calculateDiscountedAmount(this.applyPercentDiscount(plan.price * normalizedMonths, this.getOfferPercentForMonths(plan, normalizedMonths)), plan.discountType, plan.discountValue);
        await this.subscriptionHistoryModel.updateMany({
            organizationId,
            status: 'active',
            expiresAt: { $lt: new Date() },
        }, { status: 'expired' });
        const now = new Date();
        const trialDays = await this.getTrialDaysForOrg(organizationId);
        const expiresAt = this.addDays(this.addMonths(now, normalizedMonths), trialDays);
        console.log('🚀 ~ SubscriptionsService ~ verifySubscriptionPayment ~ organizationId:', organizationId);
        console.log('🚀 ~ SubscriptionsService ~ verifySubscriptionPayment ~ plan._id:', plan._id);
        console.log('🚀 ~ SubscriptionsService ~ verifySubscriptionPayment ~ expiresAt:', expiresAt);
        const organization = await this.organizationModel.findByIdAndUpdate(organizationId, {
            subscriptionPlan: plan._id,
            subscriptionExpiry: expiresAt,
            subscriptionAutoPayEnabled: Boolean(autoPay),
        }, { new: true });
        console.log('🚀 ~ SubscriptionsService ~ verifySubscriptionPayment ~ organization:', organization);
        if (!organization)
            throw new common_1.NotFoundException('Organization not found');
        await this.subscriptionHistoryModel.updateMany({ organizationId, status: 'active' }, { status: 'expired' });
        const history = await this.subscriptionHistoryModel.create({
            organizationId: new mongoose_2.Types.ObjectId(organizationId),
            subscriptionId: plan._id,
            planName: plan.name,
            price: payableAmount,
            duration: plan.duration * normalizedMonths + trialDays,
            trialDays,
            months: normalizedMonths,
            purchasedAt: now,
            expiresAt,
            purchasedBy: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
            razorpayOrderId,
            razorpayPaymentId,
            paymentStatus: 'paid',
        });
        return {
            message: 'Payment verified and subscription activated',
            subscription: plan,
            expiresAt,
            history,
        };
    }
    async getAllSubscriptionHistory(query) {
        const { page = 1, limit = 20, search, sortBy, sortOrder, datePreset, } = query || {};
        const filter = {};
        const range = (0, date_range_1.getDateRangeFromPreset)(datePreset);
        if (range) {
            filter.purchasedAt = { $gte: range.from, $lte: range.to };
        }
        if (search) {
            filter.$or = [{ planName: { $regex: search, $options: 'i' } }];
        }
        const status = query?.status;
        const paymentStatus = query?.paymentStatus;
        if (status)
            filter.status = status;
        if (paymentStatus)
            filter.paymentStatus = paymentStatus;
        const skip = (page - 1) * limit;
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
            sort.purchasedAt = -1;
        }
        const [records, total, stats] = await Promise.all([
            this.subscriptionHistoryModel
                .find(filter)
                .populate('organizationId', 'name')
                .populate('subscriptionId', 'name price duration')
                .populate('purchasedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.subscriptionHistoryModel.countDocuments(filter),
            this.subscriptionHistoryModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$price', 0],
                            },
                        },
                        totalTransactions: { $sum: 1 },
                        activeCount: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                        },
                        paidCount: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
                        },
                        freeCount: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', 'free'] }, 1, 0] },
                        },
                    },
                },
            ]),
        ]);
        const summary = stats[0] || {
            totalRevenue: 0,
            totalTransactions: 0,
            activeCount: 0,
            paidCount: 0,
            freeCount: 0,
        };
        return {
            records,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            summary,
        };
    }
    async getPlanAnalytics() {
        const now = new Date();
        const plans = await this.subscriptionModel.aggregate([
            {
                $lookup: {
                    from: 'organizations',
                    let: { planId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$subscriptionPlan', '$$planId'] },
                                        { $eq: ['$isActive', true] },
                                        { $gt: ['$subscriptionExpiry', now] },
                                    ],
                                },
                            },
                        },
                        { $count: 'count' },
                    ],
                    as: 'activeOrganizations',
                },
            },
            {
                $lookup: {
                    from: 'subscriptionhistories',
                    let: { planId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$subscriptionId', '$$planId'] },
                            },
                        },
                        { $count: 'count' },
                    ],
                    as: 'purchaseHistory',
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price: 1,
                    duration: 1,
                    isActive: 1,
                    activeCount: {
                        $ifNull: [{ $arrayElemAt: ['$activeOrganizations.count', 0] }, 0],
                    },
                    totalPurchaseCount: {
                        $ifNull: [{ $arrayElemAt: ['$purchaseHistory.count', 0] }, 0],
                    },
                },
            },
            { $sort: { name: 1 } },
        ]);
        return {
            plans,
            summary: {
                totalPlans: plans.length,
                totalActiveSubscriptions: plans.reduce((sum, plan) => sum + (Number(plan.activeCount) || 0), 0),
                totalPurchases: plans.reduce((sum, plan) => sum + (Number(plan.totalPurchaseCount) || 0), 0),
            },
        };
    }
    async getSubscriptionHistory(organizationId) {
        const records = await this.subscriptionHistoryModel
            .find({ organizationId })
            .populate('subscriptionId')
            .populate('purchasedBy', 'name email')
            .sort({ purchasedAt: -1 })
            .exec();
        const totalPurchases = records.length;
        const totalSpent = records.reduce((sum, r) => sum + r.price, 0);
        return {
            records,
            totalPurchases,
            totalSpent,
        };
    }
    async getActiveSubscriptionPlan(organizationId) {
        const record = await this.subscriptionHistoryModel
            .findOne({ organizationId, status: 'active' })
            .populate('subscriptionId')
            .sort({ purchasedAt: -1 })
            .exec();
        return record;
    }
    async setAutoPayEnabled(organizationId, enabled) {
        const org = await this.organizationModel.findById(organizationId);
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        if (!enabled && org.subscriptionRazorpaySubscriptionId) {
            try {
                await this.razorpay.subscriptions.cancel(org.subscriptionRazorpaySubscriptionId, true);
            }
            catch (err) {
                const description = err?.error?.description ||
                    err?.message ||
                    'Failed to cancel Razorpay subscription';
                throw new common_1.BadRequestException(description);
            }
        }
        const organization = await this.organizationModel.findByIdAndUpdate(organizationId, {
            subscriptionAutoPayEnabled: Boolean(enabled),
            subscriptionRazorpaySubscriptionId: enabled
                ? org.subscriptionRazorpaySubscriptionId
                : '',
        }, { new: true });
        if (!organization)
            throw new common_1.NotFoundException('Organization not found');
        return {
            message: `Auto-pay ${enabled ? 'enabled' : 'disabled'} successfully`,
            organization,
        };
    }
    async createAutopaySubscription(subscriptionId, months, organizationId, userId) {
        const plan = await this.subscriptionModel.findById(subscriptionId);
        if (!plan)
            throw new common_1.NotFoundException('Subscription plan not found');
        if (!plan.isActive)
            throw new common_1.BadRequestException('This plan is no longer available');
        const normalizedMonths = this.normalizeMonths(months);
        const payable = this.calculatePayableAmount(plan, normalizedMonths);
        if (payable.finalTotal <= 0) {
            throw new common_1.BadRequestException('Auto-pay is only available for paid plans');
        }
        const org = await this.organizationModel.findById(organizationId);
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        const razorpayPlanId = await this.ensureRazorpayPlanForSubscription(plan);
        let razorpaySubscription;
        try {
            razorpaySubscription = await this.razorpay.subscriptions.create({
                plan_id: razorpayPlanId,
                total_count: 0,
                quantity: 1,
                customer_notify: 1,
                notes: {
                    subscriptionId: subscriptionId.toString(),
                    organizationId: organizationId.toString(),
                    userId: userId.toString(),
                    months: normalizedMonths.toString(),
                    payableAmount: payable.finalTotal.toString(),
                },
            });
        }
        catch (err) {
            const description = err?.error?.description ||
                err?.message ||
                'Razorpay subscription creation failed';
            throw new common_1.BadRequestException(description);
        }
        await this.organizationModel.findByIdAndUpdate(organizationId, {
            subscriptionAutoPayEnabled: true,
            subscriptionRazorpaySubscriptionId: razorpaySubscription.id,
            subscriptionRazorpayCustomerId: razorpaySubscription.customer_id || org.subscriptionRazorpayCustomerId,
        });
        return {
            razorpaySubscriptionId: razorpaySubscription.id,
            status: razorpaySubscription.status,
            shortUrl: razorpaySubscription.short_url,
            keyId: this.configService.get('razorpay.keyId'),
            subscription: {
                id: razorpaySubscription.id,
                planId: razorpayPlanId,
                planName: plan.name,
                monthlyAmount: plan.price,
            },
            pricing: {
                selectedMonths: normalizedMonths,
                calculatedPayableAmount: payable.finalTotal,
            },
        };
    }
    async handleWebhook(body, signature, rawBody) {
        const payloadRaw = rawBody || this.normalizeRazorpayWebhookBody(body);
        if (signature) {
            const ok = this.verifyRazorpayWebhookSignature(payloadRaw, signature);
            if (!ok)
                throw new common_1.BadRequestException('Invalid webhook signature');
        }
        const event = body?.event;
        const subscriptionEntity = body?.payload?.subscription?.entity;
        const paymentEntity = body?.payload?.payment?.entity;
        const subscriptionId = subscriptionEntity?.id;
        if (!subscriptionId) {
            return { status: 'ok' };
        }
        if (event === 'subscription.cancelled') {
            await this.organizationModel.updateMany({ subscriptionRazorpaySubscriptionId: subscriptionId }, {
                subscriptionAutoPayEnabled: false,
                subscriptionRazorpaySubscriptionId: '',
            });
            return { status: 'ok' };
        }
        if (event === 'subscription.activated' ||
            event === 'subscription.charged') {
            const orgIdFromNotes = subscriptionEntity?.notes?.organizationId;
            const planIdFromNotes = subscriptionEntity?.notes?.subscriptionId;
            const monthsFromNotes = Number(subscriptionEntity?.notes?.months) || 1;
            const orgId = orgIdFromNotes;
            const planId = planIdFromNotes;
            if (!orgId || !planId) {
                return { status: 'ok' };
            }
            if (!mongoose_2.Types.ObjectId.isValid(orgId) ||
                !mongoose_2.Types.ObjectId.isValid(planId) ||
                (subscriptionEntity?.notes?.userId &&
                    !mongoose_2.Types.ObjectId.isValid(subscriptionEntity.notes.userId))) {
                return { status: 'ok' };
            }
            const plan = await this.subscriptionModel.findById(planId);
            if (!plan)
                return { status: 'ok' };
            const now = new Date();
            const org = await this.organizationModel.findById(orgId);
            if (!org)
                return { status: 'ok' };
            const currentExpiry = org.subscriptionExpiry
                ? new Date(org.subscriptionExpiry)
                : now;
            const base = currentExpiry > now ? currentExpiry : now;
            const newExpiry = this.addMonths(base, 1);
            await this.organizationModel.findByIdAndUpdate(orgId, {
                subscriptionPlan: plan._id,
                subscriptionExpiry: newExpiry,
                subscriptionAutoPayEnabled: true,
                subscriptionRazorpaySubscriptionId: subscriptionId,
                subscriptionRazorpayCustomerId: subscriptionEntity?.customer_id || org.subscriptionRazorpayCustomerId,
            });
            await this.subscriptionHistoryModel.updateMany({ organizationId: orgId, status: 'active' }, { status: 'expired' });
            const payable = this.calculatePayableAmount(plan, monthsFromNotes);
            await this.subscriptionHistoryModel.create({
                organizationId: new mongoose_2.Types.ObjectId(orgId),
                subscriptionId: plan._id,
                planName: plan.name,
                price: payable.finalTotal,
                duration: plan.duration,
                trialDays: 0,
                months: 1,
                purchasedAt: now,
                expiresAt: newExpiry,
                purchasedBy: subscriptionEntity?.notes?.userId
                    ? new mongoose_2.Types.ObjectId(subscriptionEntity.notes.userId)
                    : org.ownerId,
                status: 'active',
                razorpayOrderId: paymentEntity?.order_id || '',
                razorpayPaymentId: paymentEntity?.id || '',
                paymentStatus: 'paid',
            });
            return { status: 'ok' };
        }
        return { status: 'ok' };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subscription_schema_1.Subscription.name)),
    __param(1, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __param(2, (0, mongoose_1.InjectModel)(subscription_history_schema_1.SubscriptionHistory.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map