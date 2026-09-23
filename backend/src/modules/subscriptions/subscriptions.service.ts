import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  Subscription,
  SubscriptionDocument,
} from '../../schemas/subscription.schema';
import {
  Organization,
  OrganizationDocument,
} from '../../schemas/organization.schema';
import {
  SubscriptionHistory,
  SubscriptionHistoryDocument,
} from '../../schemas/subscription-history.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { getDateRangeFromPreset } from '../../common/utils/date-range';

@Injectable()
export class SubscriptionsService {
  private razorpay: any;

  private readonly FIRST_PURCHASE_TRIAL_DAYS = 15;

  private async getTrialDaysForOrg(organizationId: string): Promise<number> {
    // Trial should apply only for the first-ever purchase per organization.
    const alreadyPurchased = await this.subscriptionHistoryModel.exists({
      organizationId,
    });
    return alreadyPurchased ? 0 : this.FIRST_PURCHASE_TRIAL_DAYS;
  }

  private addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + (Number(days) || 0));
    return d;
  }

  private normalizeMonths(months?: number) {
    const m = Number(months);
    if (!m || Number.isNaN(m)) return 1;
    if (!Number.isInteger(m) || m < 1) {
      throw new BadRequestException('Invalid months. Months must be >= 1');
    }
    return m;
  }

  private addMonths(date: Date, months: number) {
    // Calendar-month based expiry (e.g. Mar 1 + 1 month = Apr 1)
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private calculateDiscountedAmount(
    price: number,
    discountType?: 'none' | 'flat' | 'percentage',
    discountValue?: number,
  ) {
    const base = Number(price) || 0;
    const type = discountType || 'none';
    const value = Number(discountValue) || 0;

    if (base <= 0) return 0;
    if (type === 'none' || value <= 0) return base;

    if (type === 'flat') {
      return Math.max(0, base - value);
    }

    // percentage
    const pct = Math.min(100, Math.max(0, value));
    const discount = (base * pct) / 100;
    return Math.max(0, base - discount);
  }

  private normalizeOffers(
    offers?: Array<{ months: number; offerPercent: number }>,
  ) {
    if (!offers) return [];
    if (!Array.isArray(offers)) {
      throw new BadRequestException('Offers must be an array');
    }

    const normalized = offers
      .map((o) => ({
        months: Number((o as any)?.months),
        offerPercent: Number((o as any)?.offerPercent),
      }))
      .filter((o) => !Number.isNaN(o.months) && !Number.isNaN(o.offerPercent));

    // validate and dedupe by months (keep latest)
    const map = new Map<number, { months: number; offerPercent: number }>();
    for (const o of normalized) {
      if (!o.months || o.months < 1) {
        throw new BadRequestException('Offer months must be >= 1');
      }
      if (o.offerPercent < 0 || o.offerPercent > 100) {
        throw new BadRequestException(
          'Offer percent must be between 0 and 100',
        );
      }
      map.set(o.months, { months: o.months, offerPercent: o.offerPercent });
    }

    return Array.from(map.values()).sort((a, b) => a.months - b.months);
  }

  private getOfferPercentForMonths(plan: any, months: number): number {
    const offers = Array.isArray(plan?.offers) ? plan.offers : [];
    const row = offers.find((o: any) => Number(o?.months) === Number(months));
    const pct = Number(row?.offerPercent) || 0;
    return Math.min(100, Math.max(0, pct));
  }

  private applyPercentDiscount(amount: number, percent: number) {
    const base = Number(amount) || 0;
    const pct = Math.min(100, Math.max(0, Number(percent) || 0));
    if (base <= 0 || pct <= 0) return base;
    return Math.max(0, base - (base * pct) / 100);
  }

  private getMaxOfferPercent(plan: any): number {
    const offers = Array.isArray(plan?.offers) ? plan.offers : [];
    if (!offers.length) return 0;

    return offers.reduce((max: number, offer: any) => {
      const pct = Math.min(
        100,
        Math.max(0, Number(offer?.offerPercent) || 0),
      );
      return Math.max(max, pct);
    }, 0);
  }

  private calculatePayableAmount(plan: any, months: number) {
    // total = (price * months) -> apply offer% (month-wise) -> apply plan discountType/discountValue
    const baseAmount = (Number(plan?.price) || 0) * (Number(months) || 1);
    const offerPct = this.getOfferPercentForMonths(plan, months);
    const afterOffer = this.applyPercentDiscount(baseAmount, offerPct);
    const finalTotal = this.calculateDiscountedAmount(
      afterOffer,
      plan.discountType,
      plan.discountValue,
    );

    return {
      baseAmount,
      offerPct,
      afterOffer,
      finalTotal,
    };
  }

  private async ensureRazorpayPlanForSubscription(plan: any) {
    if (plan?.razorpayPlanId) return plan.razorpayPlanId;

    // Razorpay Plan amount is per billing cycle, in subunits (paise)
    const amountInPaise = Math.round((Number(plan?.price) || 0) * 100);
    if (!amountInPaise || amountInPaise <= 0) {
      throw new BadRequestException(
        'Auto-pay is only available for paid plans with price > 0',
      );
    }

    let razorpayPlan: any;
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
    } catch (err) {
      const description =
        err?.error?.description ||
        err?.message ||
        'Razorpay plan creation failed';
      throw new BadRequestException(description);
    }

    await this.subscriptionModel.findByIdAndUpdate(plan._id, {
      razorpayPlanId: razorpayPlan.id,
    });

    return razorpayPlan.id;
  }

  private verifyRazorpayWebhookSignature(
    payloadRaw: string,
    signature: string,
  ) {
    const secret = this.configService.get<string>('razorpay.webhookSecret');
    if (!secret) {
      throw new BadRequestException(
        'Razorpay webhook secret is not configured on server',
      );
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(payloadRaw)
      .digest('hex');

    return expected === signature;
  }

  private normalizeRazorpayWebhookBody(body: any) {
    return JSON.stringify(body);
  }

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(SubscriptionHistory.name)
    private subscriptionHistoryModel: Model<SubscriptionHistoryDocument>,
    private configService: ConfigService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Razorpay = require('razorpay');
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('razorpay.keyId'),
      key_secret: this.configService.get<string>('razorpay.keySecret'),
    });
  }

  async create(dto: CreateSubscriptionDto) {
    const normalizedOffers = this.normalizeOffers((dto as any).offers);
    return this.subscriptionModel.create({
      ...dto,
      offers: normalizedOffers,
    });
  }

  async findAll(query?: PaginationQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'asc',
    } = query || {};
    const filter: any = { isActive: true };

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }];
    }

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
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

  async findOne(id: string) {
    const sub = await this.subscriptionModel.findById(id);
    if (!sub) throw new NotFoundException('Subscription plan not found');
    return sub;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const normalizedOffers = this.normalizeOffers((dto as any).offers);

    const updateDoc: any = { ...dto };
    // Only update offers when provided; for PATCH requests that omit offers,
    // we should not reset it.
    if ((dto as any).offers !== undefined) {
      updateDoc.offers = normalizedOffers;
    }

    const sub = await this.subscriptionModel.findByIdAndUpdate(id, updateDoc, {
      new: true,
    });
    if (!sub) throw new NotFoundException('Subscription plan not found');
    return sub;
  }

  async remove(id: string) {
    const sub = await this.subscriptionModel.findByIdAndDelete(id);
    if (!sub) throw new NotFoundException('Subscription plan not found');
    return { message: 'Subscription plan deleted' };
  }

  async assignToOrganization(dto: AssignSubscriptionDto) {
    const subscription = await this.subscriptionModel.findById(
      dto.subscriptionId,
    );
    if (!subscription) throw new NotFoundException('Subscription not found');

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + subscription.duration);

    const organization = await this.organizationModel.findByIdAndUpdate(
      dto.organizationId,
      {
        subscriptionPlan: subscription._id,
        subscriptionExpiry: expiryDate,
      },
      { new: true },
    );
    if (!organization) throw new NotFoundException('Organization not found');

    return organization;
  }

  async findAllPlans() {
    const plans = await this.subscriptionModel
      .find({ isActive: true })
      .sort({ price: 1 })
      .lean()
      .exec();

    return plans.map((plan: any) => {
      const price = Number(plan?.price) || 0;
      const maxOfferPercent = this.getMaxOfferPercent(plan);
      const perMonthPriceAfterOffer = Number(
        this.applyPercentDiscount(price, maxOfferPercent).toFixed(2),
      );

      return {
        ...plan,
        maxOfferPercent,
        perMonthPriceAfterOffer,
      };
    });
  }

  async purchaseSubscription(
    subscriptionId: string,
    months: number | undefined,
    autoPay: boolean | undefined,
    organizationId: string,
    userId: string,
  ) {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Invalid organizationId');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    console.log(
      '🚀 ~ SubscriptionsService ~ purchaseSubscription ~ userId:',
      userId,
    );
    console.log(
      '🚀 ~ SubscriptionsService ~ purchaseSubscription ~ organizationId:',
      organizationId,
    );
    console.log(
      '🚀 ~ SubscriptionsService ~ purchaseSubscription ~ subscriptionId:',
      subscriptionId,
    );
    const plan = await this.subscriptionModel.findById(subscriptionId);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (!plan.isActive)
      throw new BadRequestException('This plan is no longer available');

    // Mark previous history entries as expired if past their expiresAt
    await this.subscriptionHistoryModel.updateMany(
      {
        organizationId,
        status: 'active',
        expiresAt: { $lt: new Date() },
      },
      { status: 'expired' },
    );

    const normalizedMonths = this.normalizeMonths(months);

    // Calculate expiry (first purchase bonus trial days)
    const now = new Date();
    const trialDays = await this.getTrialDaysForOrg(organizationId);
    const expiresAt = this.addDays(
      this.addMonths(now, normalizedMonths),
      trialDays,
    );

    // Update organization's subscription
    const organization = await this.organizationModel.findByIdAndUpdate(
      organizationId,
      {
        subscriptionPlan: plan._id,
        subscriptionExpiry: expiresAt,
        subscriptionAutoPayEnabled: Boolean(autoPay),
      },
      { new: true },
    );
    if (!organization) throw new NotFoundException('Organization not found');

    // Mark any currently active history entries for this org as expired
    await this.subscriptionHistoryModel.updateMany(
      { organizationId, status: 'active' },
      { status: 'expired' },
    );

    // Create new history record
    // price is treated as monthly price
    const baseAmount = plan.price * normalizedMonths;
    const monthsOfferPct = this.getOfferPercentForMonths(
      plan,
      normalizedMonths,
    );
    const offerDiscountedAmount = this.applyPercentDiscount(
      baseAmount,
      monthsOfferPct,
    );
    const payableAmount = this.calculateDiscountedAmount(
      offerDiscountedAmount,
      plan.discountType,
      plan.discountValue,
    );

    const history = await this.subscriptionHistoryModel.create({
      organizationId: new Types.ObjectId(organizationId),
      subscriptionId: plan._id,
      planName: plan.name,
      price: payableAmount,
      duration: plan.duration * normalizedMonths + trialDays,
      trialDays,
      months: normalizedMonths,
      purchasedAt: now,
      expiresAt,
      purchasedBy: new Types.ObjectId(userId),
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

  async createSubscriptionOrder(
    subscriptionId: string,
    months: number | undefined,
    autoPay: boolean | undefined,
    organizationId: string,
  ) {
    const plan = await this.subscriptionModel.findById(subscriptionId);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (!plan.isActive)
      throw new BadRequestException('This plan is no longer available');
    const normalizedMonths = this.normalizeMonths(months);

    const payableAmount = this.calculateDiscountedAmount(
      this.applyPercentDiscount(
        plan.price * normalizedMonths,
        this.getOfferPercentForMonths(plan, normalizedMonths),
      ),
      plan.discountType,
      plan.discountValue,
    );

    if (payableAmount === 0)
      throw new BadRequestException(
        'Use the direct purchase endpoint for free plans',
      );

    // receipt max 40 chars — use short timestamp suffix only
    const receipt = `sub_${Date.now()}`;

    let razorpayOrder: any;
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
    } catch (err) {
      const description =
        err?.error?.description ||
        err?.message ||
        'Razorpay order creation failed';
      throw new BadRequestException(description);
    }

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: this.configService.get<string>('razorpay.keyId'),
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

  async verifySubscriptionPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    subscriptionId: string,
    months: number | undefined,
    autoPay: boolean | undefined,
    organizationId: string,
    userId: string,
  ) {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Invalid organizationId');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const secret = this.configService.get<string>('razorpay.keySecret');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const plan = await this.subscriptionModel.findById(subscriptionId);
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const normalizedMonths = this.normalizeMonths(months);

    const payableAmount = this.calculateDiscountedAmount(
      this.applyPercentDiscount(
        plan.price * normalizedMonths,
        this.getOfferPercentForMonths(plan, normalizedMonths),
      ),
      plan.discountType,
      plan.discountValue,
    );

    await this.subscriptionHistoryModel.updateMany(
      {
        organizationId,
        status: 'active',
        expiresAt: { $lt: new Date() },
      },
      { status: 'expired' },
    );

    const now = new Date();
    const trialDays = await this.getTrialDaysForOrg(organizationId);
    const expiresAt = this.addDays(
      this.addMonths(now, normalizedMonths),
      trialDays,
    );
    console.log(
      '🚀 ~ SubscriptionsService ~ verifySubscriptionPayment ~ organizationId:',
      organizationId,
    );
    console.log(
      '🚀 ~ SubscriptionsService ~ verifySubscriptionPayment ~ plan._id:',
      plan._id,
    );
    console.log(
      '🚀 ~ SubscriptionsService ~ verifySubscriptionPayment ~ expiresAt:',
      expiresAt,
    );

    const organization = await this.organizationModel.findByIdAndUpdate(
      organizationId,
      {
        subscriptionPlan: plan._id,
        subscriptionExpiry: expiresAt,
        subscriptionAutoPayEnabled: Boolean(autoPay),
      },
      { new: true },
    );
    console.log(
      '🚀 ~ SubscriptionsService ~ verifySubscriptionPayment ~ organization:',
      organization,
    );
    if (!organization) throw new NotFoundException('Organization not found');

    await this.subscriptionHistoryModel.updateMany(
      { organizationId, status: 'active' },
      { status: 'expired' },
    );

    const history = await this.subscriptionHistoryModel.create({
      organizationId: new Types.ObjectId(organizationId),
      subscriptionId: plan._id,
      planName: plan.name,
      price: payableAmount,
      duration: plan.duration * normalizedMonths + trialDays,
      trialDays,
      months: normalizedMonths,
      purchasedAt: now,
      expiresAt,
      purchasedBy: new Types.ObjectId(userId),
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

  async getAllSubscriptionHistory(query?: PaginationQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy,
      sortOrder,
      datePreset,
    } = query || {};
    const filter: any = {};

    const range = getDateRangeFromPreset(datePreset);
    if (range) {
      // For subscription histories, use purchasedAt
      filter.purchasedAt = { $gte: range.from, $lte: range.to };
    }

    if (search) {
      filter.$or = [{ planName: { $regex: search, $options: 'i' } }];
    }
    // Extra filters for history API (not part of PaginationQueryDto)
    const status = (query as any)?.status;
    const paymentStatus = (query as any)?.paymentStatus;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (page - 1) * limit;
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
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
        totalActiveSubscriptions: plans.reduce(
          (sum, plan) => sum + (Number(plan.activeCount) || 0),
          0,
        ),
        totalPurchases: plans.reduce(
          (sum, plan) => sum + (Number(plan.totalPurchaseCount) || 0),
          0,
        ),
      },
    };
  }

  async getSubscriptionHistory(organizationId: string) {
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

  async getActiveSubscriptionPlan(organizationId: string) {
    const record = await this.subscriptionHistoryModel
      .findOne({ organizationId, status: 'active' })
      .populate('subscriptionId')
      .sort({ purchasedAt: -1 })
      .exec();

    return record;
  }

  async setAutoPayEnabled(organizationId: string, enabled: boolean) {
    const org = await this.organizationModel.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found');

    // If disabling, also cancel Razorpay subscription if present.
    if (!enabled && org.subscriptionRazorpaySubscriptionId) {
      try {
        // Cancel immediately to prevent further charges.
        await this.razorpay.subscriptions.cancel(
          org.subscriptionRazorpaySubscriptionId,
          true,
        );
      } catch (err) {
        const description =
          err?.error?.description ||
          err?.message ||
          'Failed to cancel Razorpay subscription';
        throw new BadRequestException(description);
      }
    }

    const organization = await this.organizationModel.findByIdAndUpdate(
      organizationId,
      {
        subscriptionAutoPayEnabled: Boolean(enabled),
        subscriptionRazorpaySubscriptionId: enabled
          ? org.subscriptionRazorpaySubscriptionId
          : '',
      },
      { new: true },
    );

    if (!organization) throw new NotFoundException('Organization not found');

    return {
      message: `Auto-pay ${enabled ? 'enabled' : 'disabled'} successfully`,
      organization,
    };
  }

  async createAutopaySubscription(
    subscriptionId: string,
    months: number | undefined,
    organizationId: string,
    userId: string,
  ) {
    const plan = await this.subscriptionModel.findById(subscriptionId);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (!plan.isActive)
      throw new BadRequestException('This plan is no longer available');

    const normalizedMonths = this.normalizeMonths(months);

    // AutoPay is monthly renewal, but we still compute payable amount for displaying/recording.
    // (We do NOT support “charge every N months” in this mode.)
    const payable = this.calculatePayableAmount(plan, normalizedMonths);

    if (payable.finalTotal <= 0) {
      throw new BadRequestException(
        'Auto-pay is only available for paid plans',
      );
    }

    const org = await this.organizationModel.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found');

    // Ensure we have a Razorpay plan id (monthly)
    const razorpayPlanId = await this.ensureRazorpayPlanForSubscription(plan);

    // Create Razorpay subscription
    let razorpaySubscription: any;
    try {
      razorpaySubscription = await this.razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: 0, // infinite cycles
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
    } catch (err) {
      const description =
        err?.error?.description ||
        err?.message ||
        'Razorpay subscription creation failed';
      throw new BadRequestException(description);
    }

    // Persist intent on organization (will be fully activated by webhook/payment capture)
    await this.organizationModel.findByIdAndUpdate(organizationId, {
      subscriptionAutoPayEnabled: true,
      subscriptionRazorpaySubscriptionId: razorpaySubscription.id,
      subscriptionRazorpayCustomerId:
        razorpaySubscription.customer_id || org.subscriptionRazorpayCustomerId,
    });

    return {
      razorpaySubscriptionId: razorpaySubscription.id,
      status: razorpaySubscription.status,
      shortUrl: razorpaySubscription.short_url,
      keyId: this.configService.get<string>('razorpay.keyId'),
      // For Razorpay checkout subscription mode
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

  async handleWebhook(body: any, signature: string, rawBody?: string) {
    const payloadRaw = rawBody || this.normalizeRazorpayWebhookBody(body);

    if (signature) {
      const ok = this.verifyRazorpayWebhookSignature(payloadRaw, signature);
      if (!ok) throw new BadRequestException('Invalid webhook signature');
    }

    const event = body?.event;

    // Important events:
    // - subscription.activated (first payment done / mandate accepted)
    // - subscription.charged (each successful recurring charge)
    // - subscription.cancelled
    const subscriptionEntity = body?.payload?.subscription?.entity;
    const paymentEntity = body?.payload?.payment?.entity;
    const subscriptionId = subscriptionEntity?.id;

    if (!subscriptionId) {
      return { status: 'ok' };
    }

    if (event === 'subscription.cancelled') {
      await this.organizationModel.updateMany(
        { subscriptionRazorpaySubscriptionId: subscriptionId },
        {
          subscriptionAutoPayEnabled: false,
          subscriptionRazorpaySubscriptionId: '',
        },
      );
      return { status: 'ok' };
    }

    if (
      event === 'subscription.activated' ||
      event === 'subscription.charged'
    ) {
      // Resolve our org + plan
      const orgIdFromNotes = subscriptionEntity?.notes?.organizationId;
      const planIdFromNotes = subscriptionEntity?.notes?.subscriptionId;
      const monthsFromNotes = Number(subscriptionEntity?.notes?.months) || 1;

      const orgId = orgIdFromNotes;
      const planId = planIdFromNotes;
      if (!orgId || !planId) {
        return { status: 'ok' };
      }
      if (
        !Types.ObjectId.isValid(orgId) ||
        !Types.ObjectId.isValid(planId) ||
        (subscriptionEntity?.notes?.userId &&
          !Types.ObjectId.isValid(subscriptionEntity.notes.userId))
      ) {
        return { status: 'ok' };
      }

      const plan = await this.subscriptionModel.findById(planId);
      if (!plan) return { status: 'ok' };

      // Extend expiry by 1 month on each charge (monthly cycle)
      const now = new Date();
      const org = await this.organizationModel.findById(orgId);
      if (!org) return { status: 'ok' };

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
        subscriptionRazorpayCustomerId:
          subscriptionEntity?.customer_id || org.subscriptionRazorpayCustomerId,
      });

      // Mark current active history as expired and create new one
      await this.subscriptionHistoryModel.updateMany(
        { organizationId: orgId, status: 'active' },
        { status: 'expired' },
      );

      const payable = this.calculatePayableAmount(plan, monthsFromNotes);
      await this.subscriptionHistoryModel.create({
        organizationId: new Types.ObjectId(orgId),
        subscriptionId: plan._id,
        planName: plan.name,
        price: payable.finalTotal,
        duration: plan.duration, // informational (base duration)
        trialDays: 0,
        months: 1,
        purchasedAt: now,
        expiresAt: newExpiry,
        purchasedBy: subscriptionEntity?.notes?.userId
          ? new Types.ObjectId(subscriptionEntity.notes.userId)
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
}
