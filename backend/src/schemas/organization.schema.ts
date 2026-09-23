import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Organization {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  slug: string;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiProperty()
  @Prop()
  logo: string;

  @ApiProperty()
  @Prop()
  address: string;

  @ApiProperty()
  @Prop()
  phone: string;

  @ApiProperty()
  @Prop()
  email: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Subscription', default: null })
  subscriptionPlan: Types.ObjectId;

  @ApiProperty({
    description:
      'Whether auto-pay is enabled for the current active subscription. When enabled, the system may auto-renew the subscription in the future (implementation-dependent).',
    required: false,
    default: false,
  })
  @Prop({ default: false })
  subscriptionAutoPayEnabled: boolean;

  @ApiProperty({
    description:
      'Razorpay subscription id when auto-pay is enabled. Used to cancel/track recurring payments.',
    required: false,
    default: '',
  })
  @Prop({ default: '' })
  subscriptionRazorpaySubscriptionId: string;

  @ApiProperty({
    description:
      'Razorpay customer id for the organization (optional, created on-demand for subscriptions).',
    required: false,
    default: '',
  })
  @Prop({ default: '' })
  subscriptionRazorpayCustomerId: string;

  @ApiProperty()
  @Prop({ default: null })
  subscriptionExpiry: Date;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;
}

export type OrganizationDocument = Organization & Document;
export const OrganizationSchema = SchemaFactory.createForClass(Organization);
