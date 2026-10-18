import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongoose3DecimalSetter } from '../common/utils/precision';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CouponUsage {
  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: true, index: true })
  couponId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  customerId?: Types.ObjectId | null;

  @Prop({ required: true, min: 0, type: Number, set: mongoose3DecimalSetter })
  discountAmount: number;
}

export type CouponUsageDocument = CouponUsage & Document;
export const CouponUsageSchema = SchemaFactory.createForClass(CouponUsage);
