import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class SubscriptionHistory {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Subscription', required: true })
  subscriptionId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  planName: string;

  @ApiProperty()
  @Prop({ required: true })
  price: number;

  @ApiProperty()
  @Prop({ required: true })
  duration: number;

  @ApiProperty({
    description:
      'Extra trial days granted on first-ever purchase for an organization.',
    required: false,
    default: 0,
  })
  @Prop({ default: 0 })
  trialDays: number;

  @ApiProperty({
    description:
      'Selected duration in months for this purchase. For legacy records this may be missing.',
    required: false,
    default: 1,
  })
  @Prop({ default: 1 })
  months: number;

  @ApiProperty()
  @Prop({ default: () => new Date() })
  purchasedAt: Date;

  @ApiProperty()
  @Prop({ required: true })
  expiresAt: Date;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  purchasedBy: Types.ObjectId;

  @ApiProperty()
  @Prop({
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  })
  status: string;

  @ApiProperty()
  @Prop({ default: '' })
  razorpayOrderId: string;

  @ApiProperty()
  @Prop({ default: '' })
  razorpayPaymentId: string;

  @ApiProperty()
  @Prop({
    type: String,
    enum: ['pending', 'paid', 'free'],
    default: 'free',
  })
  paymentStatus: string;
}

export type SubscriptionHistoryDocument = SubscriptionHistory & Document;
export const SubscriptionHistorySchema =
  SchemaFactory.createForClass(SubscriptionHistory);
