import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { mongoose3DecimalSetter } from '../common/utils/precision';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
}

export enum OrderItemStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export enum ManualDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export class SelectedAddOn {
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  emoji?: string;

  @ApiProperty({ required: false, default: 0 })
  priceDelta?: number;
}

export class SelectedSpiceLevel {
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  emoji?: string;

  @ApiProperty({ required: false, default: 0 })
  priceDelta?: number;
}

export class OrderItem {
  @ApiProperty()
  menuItemId: Types.ObjectId;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ enum: OrderItemStatus })
  status: OrderItemStatus;

  @ApiProperty({ default: 0 })
  cancelledQuantity: number;

  @ApiProperty({ required: false })
  cancelReason?: string;

  @ApiProperty({ required: false })
  cancelledBy?: Types.ObjectId;

  @ApiProperty({ required: false })
  cancelledAt?: Date;

  @ApiProperty()
  itemType: string;

  @ApiProperty({ required: false, type: SelectedSpiceLevel })
  spiceLevel?: SelectedSpiceLevel;

  @ApiProperty({ required: false, type: [SelectedAddOn] })
  addOns?: SelectedAddOn[];

  @ApiProperty({ required: false })
  specialInstructions?: string;
}

@Schema({ timestamps: true })
export class Order {
  @ApiProperty()
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Table', required: false })
  tableId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: 'dine_in' })
  orderType: string;

  @ApiProperty({ enum: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.ONLINE] })
  @Prop({
    type: String,
    enum: [
      PaymentMethod.CASH,
      PaymentMethod.CARD,
      PaymentMethod.ONLINE,
      'cash',
      'card',
      'online',
    ],
    default: PaymentMethod.CASH,
    set: (val: string) => (typeof val === 'string' ? (val.toUpperCase() as PaymentMethod) : val),
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ type: [OrderItem] })
  @Prop({
    type: [
      {
        menuItemId: { type: MongooseSchema.Types.ObjectId, ref: 'MenuItem' },
        name: String,
        price: { type: Number, set: mongoose3DecimalSetter },
        quantity: Number,
        status: { type: String, default: OrderItemStatus.ACTIVE },
        cancelledQuantity: { type: Number, default: 0 },
        cancelReason: { type: String, default: '' },
        cancelledBy: { type: MongooseSchema.Types.ObjectId, ref: 'User', required: false },
        cancelledAt: { type: Date, required: false },
        itemType: { type: String, default: 'food' },
        spiceLevel: {
          type: {
            name: String,
            emoji: { type: String, default: '' },
            priceDelta: { type: Number, default: 0, set: mongoose3DecimalSetter },
          },
          required: false,
          _id: false,
        },
        addOns: {
          type: [
            {
              name: String,
              emoji: { type: String, default: '' },
              priceDelta: { type: Number, default: 0, set: mongoose3DecimalSetter },
              _id: false,
            },
          ],
          default: [],
        },
        specialInstructions: { type: String, default: '' },
      },
    ],
    required: true,
  })
  items: OrderItem[];

  @ApiProperty()
  @Prop({ required: true, type: Number, set: mongoose3DecimalSetter })
  totalAmount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  subtotalAmount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  taxAmount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  taxRate: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  cgstRate: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  sgstRate: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  cgstAmount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  sgstAmount: number;

  @ApiProperty()
  @Prop({ default: 'exclusive' })
  taxType: string;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  vatAmount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  vatRate: number;

  @ApiProperty()
  @Prop({ default: 'exclusive' })
  vatType: string;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  foodSubtotal: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  liquorSubtotal: number;

  @ApiProperty({ required: false })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Coupon', required: false })
  couponId?: Types.ObjectId;

  @ApiProperty({ required: false })
  @Prop()
  couponCode?: string;

  @ApiProperty({ default: 0 })
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  discountAmount: number;

  @ApiProperty({ enum: ManualDiscountType, required: false })
  @Prop({ enum: ManualDiscountType, required: false, default: null })
  manualDiscountType?: ManualDiscountType | null;

  @ApiProperty({ required: false, default: 0 })
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  manualDiscountValue?: number;

  @ApiProperty({ default: 0 })
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  manualDiscountAmount?: number;

  @ApiProperty({ required: false, default: '' })
  @Prop({ default: '' })
  manualDiscountReason?: string;

  @ApiProperty({ enum: ManualDiscountType, required: false })
  @Prop({ enum: ManualDiscountType, required: false, default: null })
  manual_discount_type?: ManualDiscountType | null;

  @ApiProperty({ required: false, default: 0 })
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  manual_discount_value?: number;

  @ApiProperty({ default: 0 })
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  manual_discount_amount?: number;

  @ApiProperty({ required: false, default: '' })
  @Prop({ default: '' })
  manual_discount_reason?: string;

  @ApiProperty({ enum: OrderStatus })
  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty()
  @Prop()
  customerName: string;

  @ApiProperty()
  @Prop()
  customerPhone: string;

  @ApiProperty({ enum: PaymentStatus })
  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description:
      'Whether payment gateway payment is required for this order based on active subscription plan.',
    default: false,
  })
  @Prop({ default: false })
  isPaymentGatewayAllocated: boolean;

  @ApiProperty({ required: false, default: '' })
  @Prop({ default: '' })
  razorpayOrderId: string;

  @ApiProperty({ required: false, default: '' })
  @Prop({ default: '' })
  razorpayPaymentId: string;

  @ApiProperty()
  @Prop()
  paymentId: string;
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.pre('validate', function () {
  if (this.paymentMethod && typeof this.paymentMethod === 'string') {
    this.paymentMethod = (this.paymentMethod as string).toUpperCase() as any;
  }
  if (this.paymentStatus && typeof this.paymentStatus === 'string') {
    this.paymentStatus = (this.paymentStatus as string).toLowerCase() as any;
  }
  if (this.status && typeof this.status === 'string') {
    this.status = (this.status as string).toLowerCase() as any;
  }
});
