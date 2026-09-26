import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionOffer {
  @ApiProperty({ example: 3, description: 'Offer applies for X months' })
  months: number;

  @ApiProperty({
    example: 50,
    description: 'Percentage discount (0-100) applied on total amount',
  })
  offerPercent: number;
}

@Schema({ timestamps: true })
export class Subscription {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true })
  price: number;

  @ApiProperty({ enum: ['none', 'flat', 'percentage'], default: 'none' })
  @Prop({
    type: String,
    enum: ['none', 'flat', 'percentage'],
    default: 'none',
  })
  discountType: 'none' | 'flat' | 'percentage';

  @ApiProperty({
    description: 'Flat amount or percentage (%) based on discountType',
    default: 0,
  })
  @Prop({ default: 0 })
  discountValue: number;

  @ApiProperty({
    description:
      'Whether this subscription plan requires payment gateway based purchase flow',
    default: false,
  })
  @Prop({ default: false })
  isPaymentGatewayAllocated: boolean;

  @ApiProperty({
    description:
      'Whether this subscription plan allows restaurant menu PDF uploads and PDF QR access.',
    default: false,
  })
  @Prop({ default: false })
  isMenuPdfEnabled: boolean;

  @ApiProperty()
  @Prop({ required: true })
  duration: number;

  @ApiProperty({
    description:
      'Razorpay Plan id used for recurring subscription auto-pay (monthly). This is created on-demand when auto-pay is enabled.',
    required: false,
    default: '',
  })
  @Prop({ default: '' })
  razorpayPlanId: string;

  @ApiProperty()
  @Prop({ default: 10 })
  maxTables: number;

  @ApiProperty()
  @Prop({ default: 50 })
  maxMenuItems: number;

  @ApiProperty()
  @Prop({ default: 0 })
  maxCategories: number;

  @ApiProperty()
  @Prop({ default: 5 })
  maxRestaurants: number;

  @ApiProperty()
  @Prop({
    type: String,
    enum: ['none', 'optional', 'included'],
    default: 'none',
  })
  customerDataAccess: string;

  @ApiProperty()
  @Prop({ type: [String], default: [] })
  features: string[];

  @ApiProperty({
    required: false,
    type: [SubscriptionOffer],
    description:
      'Month-based offers. Example: {months: 3, offerPercent: 50} => 50% off for 3-month purchase.',
  })
  @Prop({
    type: [
      {
        months: { type: Number, required: true },
        offerPercent: { type: Number, required: true },
      },
    ],
    default: [],
  })
  offers: SubscriptionOffer[];

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;
}

export type SubscriptionDocument = Subscription & Document;
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
