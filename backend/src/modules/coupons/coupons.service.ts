import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument, CouponDiscountType } from '../../schemas/coupon.schema';
import { CouponUsage, CouponUsageDocument } from '../../schemas/coupon-usage.schema';
import { MenuItem, MenuItemDocument } from '../../schemas/menu-item.schema';
import { Restaurant, RestaurantDocument } from '../../schemas/restaurant.schema';
import { Role } from '../../common/decorators';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(CouponUsage.name)
    private couponUsageModel: Model<CouponUsageDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async resolveRestaurantId(
    requestedRestaurantId: string | undefined,
    role: string,
    organizationId?: string,
    userRestaurantId?: string,
  ) {
    if (role === Role.RESTAURANT_OWNER) {
      if (!userRestaurantId) throw new ForbiddenException('Restaurant not assigned');
      if (requestedRestaurantId && requestedRestaurantId !== userRestaurantId) {
        throw new ForbiddenException('Restaurant access denied');
      }
      return userRestaurantId;
    }

    if (!requestedRestaurantId || !Types.ObjectId.isValid(requestedRestaurantId)) {
      throw new BadRequestException('Valid restaurantId is required');
    }

    const restaurant = await this.restaurantModel
      .findById(requestedRestaurantId)
      .select('organizationId');
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (
      role === Role.ORG_ADMIN &&
      (!organizationId || restaurant.organizationId?.toString() !== organizationId)
    ) {
      throw new ForbiddenException('Restaurant does not belong to your organization');
    }
    return requestedRestaurantId;
  }

  private async ensureCouponAccess(
    coupon: CouponDocument,
    role: string,
    organizationId?: string,
    userRestaurantId?: string,
  ) {
    const restaurantId = await this.resolveRestaurantId(
      coupon.restaurantId.toString(),
      role,
      organizationId,
      userRestaurantId,
    );
    if (coupon.restaurantId.toString() !== restaurantId) {
      throw new ForbiddenException('Coupon access denied');
    }
  }

  async findAll(restaurantId: string) {
    return this.couponModel
      .find({ restaurantId: new Types.ObjectId(restaurantId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async create(
    dto: CreateCouponDto,
    restaurantId: string,
  ) {
    this.validateCouponFields(dto);
    try {
      return await this.couponModel.create({
        ...dto,
        restaurantId: new Types.ObjectId(restaurantId),
        code: dto.code.trim().toUpperCase(),
        startAt: new Date(dto.startAt),
        expiresAt: new Date(dto.expiresAt),
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit ?? null,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Coupon code already exists for this restaurant');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateCouponDto,
    role: string,
    organizationId?: string,
    userRestaurantId?: string,
  ) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) throw new NotFoundException('Coupon not found');
    await this.ensureCouponAccess(coupon, role, organizationId, userRestaurantId);

    const next = { ...coupon.toObject(), ...dto };
    this.validateCouponFields(next);
    const update: Record<string, any> = { ...dto };
    if (dto.code !== undefined) update.code = dto.code.trim().toUpperCase();
    if (dto.startAt !== undefined) update.startAt = new Date(dto.startAt);
    if (dto.expiresAt !== undefined) update.expiresAt = new Date(dto.expiresAt);
    if (dto.maxDiscount !== undefined) update.maxDiscount = dto.maxDiscount ?? null;
    if (dto.usageLimit !== undefined) update.usageLimit = dto.usageLimit ?? null;

    try {
      return await this.couponModel.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Coupon code already exists for this restaurant');
      }
      throw error;
    }
  }

  async remove(
    id: string,
    role: string,
    organizationId?: string,
    userRestaurantId?: string,
  ) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) throw new NotFoundException('Coupon not found');
    await this.ensureCouponAccess(coupon, role, organizationId, userRestaurantId);
    await this.couponUsageModel.deleteMany({ couponId: coupon._id });
    await this.couponModel.findByIdAndDelete(id);
    return { message: 'Coupon deleted successfully' };
  }

  async priceOrderItems(
    restaurantId: string,
    items: Array<{
      menuItemId: string;
      quantity: number;
      spiceLevel?: { name: string; emoji?: string; priceDelta?: number };
      addOns?: Array<{ name: string; emoji?: string; priceDelta?: number }>;
      specialInstructions?: string;
    }>,
  ) {
    if (!items?.length) throw new BadRequestException('Order must contain items');
    const itemIds = items.map((item) => item.menuItemId);
    if (itemIds.some((id) => !Types.ObjectId.isValid(id))) {
      throw new BadRequestException('Invalid menuItemId');
    }
    if (items.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
      throw new BadRequestException('Item quantity must be a positive integer');
    }

    const menuItems = await this.menuItemModel
      .find({
        _id: { $in: itemIds.map((id) => new Types.ObjectId(id)) },
        restaurantId: new Types.ObjectId(restaurantId),
        isAvailable: true,
      })
      .select('name price itemType discountType discountValue');
    const menuItemsById = new Map(menuItems.map((item) => [item._id.toString(), item]));
    return items.map((item) => {
      const menuItem = menuItemsById.get(item.menuItemId);
      if (!menuItem) {
        throw new BadRequestException('An order item is unavailable or belongs to another restaurant');
      }
      const addOnsTotal = (item.addOns || []).reduce(
        (sum, addOn) => sum + (Number(addOn.priceDelta) || 0),
        0,
      );
      const spiceLevelDelta = Number(item.spiceLevel?.priceDelta) || 0;
      const discountValue = Number(menuItem.discountValue) || 0;
      const discountAmount = menuItem.discountType === 'percentage'
        ? (menuItem.price * Math.min(discountValue, 100)) / 100
        : menuItem.discountType === 'fixed'
          ? Math.min(discountValue, menuItem.price)
          : 0;
      const discountedPrice = Math.max(
        0,
        Math.round((menuItem.price - discountAmount) * 100) / 100,
      );
      const unitPrice =
        Math.round((discountedPrice + addOnsTotal + spiceLevelDelta) * 100) / 100;
      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: unitPrice,
        quantity: Number(item.quantity),
        itemType: menuItem.itemType || 'food',
        spiceLevel: item.spiceLevel
          ? {
              name: item.spiceLevel.name,
              emoji: item.spiceLevel.emoji || '',
              priceDelta: spiceLevelDelta,
            }
          : undefined,
        addOns: (item.addOns || []).map((addOn) => ({
          name: addOn.name,
          emoji: addOn.emoji || '',
          priceDelta: Number(addOn.priceDelta) || 0,
        })),
        specialInstructions: item.specialInstructions || '',
      };
    });
  }

  async validateCoupon(
    restaurantId: string,
    code: string,
    subtotal: number,
    existingOrderId?: Types.ObjectId,
  ) {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }
    const normalizedCode = code?.trim().toUpperCase();
    if (!normalizedCode) throw new BadRequestException('Coupon code is required');
    const coupon = await this.couponModel.findOne({
      restaurantId: new Types.ObjectId(restaurantId),
      code: normalizedCode,
    });
    if (!coupon) throw new BadRequestException('Coupon not found');

    const now = new Date();
    if (!coupon.isActive) throw new BadRequestException('Coupon is inactive');
    if (coupon.startAt > now) throw new BadRequestException('Coupon is not active yet');
    if (coupon.expiresAt < now) throw new BadRequestException('Coupon has expired');
    if (subtotal < coupon.minOrderAmount) {
      throw new BadRequestException(`Minimum order amount is ${coupon.minOrderAmount}`);
    }
    const hasExistingUsage = existingOrderId
      ? Boolean(await this.couponUsageModel.exists({
          couponId: coupon._id,
          orderId: existingOrderId,
        }))
      : false;
    if (
      coupon.usageLimit != null &&
      coupon.usageCount >= coupon.usageLimit &&
      !hasExistingUsage
    ) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    let discountAmount =
      coupon.discountType === CouponDiscountType.PERCENTAGE
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
    if (coupon.discountType === CouponDiscountType.PERCENTAGE && coupon.maxDiscount != null) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
    discountAmount = Math.round(Math.min(discountAmount, subtotal) * 100) / 100;
    if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
      throw new BadRequestException('Coupon discount is invalid');
    }
    return { coupon, discountAmount };
  }

  async recordUsage(
    couponId: Types.ObjectId,
    orderId: Types.ObjectId,
    discountAmount: number,
  ) {
    const now = new Date();
    const coupon = await this.couponModel.findOneAndUpdate(
      {
        _id: couponId,
        isActive: true,
        startAt: { $lte: now },
        expiresAt: { $gte: now },
        $or: [
          { usageLimit: null },
          { usageLimit: { $exists: false } },
          { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
        ],
      },
      { $inc: { usageCount: 1 } },
      { new: true },
    );
    if (!coupon) throw new BadRequestException('Coupon is no longer available');

    try {
      await this.couponUsageModel.create({
        couponId,
        orderId,
        discountAmount,
      });
    } catch (error) {
      await this.couponModel.updateOne(
        { _id: couponId, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
      );
      throw error;
    }
  }

  async revertUsage(orderId: Types.ObjectId) {
    const usage = await this.couponUsageModel.findOneAndDelete({ orderId });
    if (usage) {
      await this.couponModel.updateOne(
        { _id: usage.couponId, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
      );
    }
  }

  async replaceUsage(
    orderId: Types.ObjectId,
    couponId: Types.ObjectId | null,
    discountAmount: number,
  ) {
    const existingUsage = await this.couponUsageModel.findOne({ orderId });
    if (!couponId) {
      if (existingUsage) {
        await this.couponUsageModel.deleteOne({ _id: existingUsage._id });
        await this.couponModel.updateOne(
          { _id: existingUsage.couponId, usageCount: { $gt: 0 } },
          { $inc: { usageCount: -1 } },
        );
      }
      return;
    }

    if (existingUsage?.couponId.toString() === couponId.toString()) {
      await this.couponUsageModel.updateOne(
        { _id: existingUsage._id },
        { $set: { discountAmount } },
      );
      return;
    }

    const now = new Date();
    const coupon = await this.couponModel.findOneAndUpdate(
      {
        _id: couponId,
        isActive: true,
        startAt: { $lte: now },
        expiresAt: { $gte: now },
        $or: [
          { usageLimit: null },
          { usageLimit: { $exists: false } },
          { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
        ],
      },
      { $inc: { usageCount: 1 } },
      { new: true },
    );
    if (!coupon) throw new BadRequestException('Coupon is no longer available');

    try {
      if (existingUsage) {
        await this.couponUsageModel.updateOne(
          { _id: existingUsage._id },
          { $set: { couponId, discountAmount } },
        );
      } else {
        await this.couponUsageModel.create({ couponId, orderId, discountAmount });
      }
    } catch (error) {
      await this.couponModel.updateOne(
        { _id: couponId, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
      );
      throw error;
    }

    if (existingUsage) {
      await this.couponModel.updateOne(
        { _id: existingUsage.couponId, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
      );
    }
  }

  private validateCouponFields(dto: {
    discountType?: CouponDiscountType;
    discountValue?: number;
    maxDiscount?: number | null;
    startAt?: string | Date;
    expiresAt?: string | Date;
  }) {
    if (
      dto.discountType === CouponDiscountType.PERCENTAGE &&
      (Number(dto.discountValue) > 100 || Number(dto.discountValue) <= 0)
    ) {
      throw new BadRequestException('Percentage discount must be greater than 0 and at most 100');
    }
    if (dto.discountType === CouponDiscountType.FIXED && Number(dto.discountValue) <= 0) {
      throw new BadRequestException('Fixed discount must be greater than 0');
    }
    if (
      dto.discountType === CouponDiscountType.FIXED &&
      dto.maxDiscount != null
    ) {
      throw new BadRequestException('Maximum discount is only valid for percentage coupons');
    }
    const startAt = dto.startAt instanceof Date ? dto.startAt : new Date(dto.startAt);
    const expiresAt = dto.expiresAt instanceof Date ? dto.expiresAt : new Date(dto.expiresAt);
    if (dto.startAt && dto.expiresAt && startAt >= expiresAt) {
      throw new BadRequestException('Expiry date must be after the start date');
    }
  }
}
