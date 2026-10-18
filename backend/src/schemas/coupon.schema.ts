import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongoose3DecimalSetter } from '../common/utils/precision';

export enum CouponDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, enum: CouponDiscountType })
  discountType: CouponDiscountType;

  @Prop({ required: true, min: 0, type: Number, set: mongoose3DecimalSetter })
  discountValue: number;

  @Prop({ required: true, min: 0, default: 0, type: Number, set: mongoose3DecimalSetter })
  minOrderAmount: number;

  @Prop({ min: 0, default: null, type: Number, set: mongoose3DecimalSetter })
  maxDiscount?: number | null;

  @Prop({ required: true })
  startAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ min: 1, default: null })
  usageLimit?: number | null;

  @Prop({ default: 0, min: 0 })
  usageCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export type CouponDocument = Coupon & Document;
export const CouponSchema = SchemaFactory.createForClass(Coupon);
CouponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
