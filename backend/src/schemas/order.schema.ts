import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

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

export enum OrderItemStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
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
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Table', required: false })
  tableId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: 'dine_in' })
  orderType: string;

  @ApiProperty()
  @Prop({ default: 'cash' })
  paymentMethod: string;

  @ApiProperty({ type: [OrderItem] })
  @Prop({
    type: [
      {
        menuItemId: { type: Types.ObjectId, ref: 'MenuItem' },
        name: String,
        price: Number,
        quantity: Number,
        status: { type: String, default: OrderItemStatus.ACTIVE },
        cancelledQuantity: { type: Number, default: 0 },
        cancelReason: { type: String, default: '' },
        cancelledBy: { type: Types.ObjectId, ref: 'User', required: false },
        cancelledAt: { type: Date, required: false },
        itemType: { type: String, default: 'food' },
        spiceLevel: {
          type: {
            name: String,
            emoji: { type: String, default: '' },
            priceDelta: { type: Number, default: 0 },
          },
          required: false,
          _id: false,
        },
        addOns: {
          type: [
            {
              name: String,
              emoji: { type: String, default: '' },
              priceDelta: { type: Number, default: 0 },
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
  @Prop({ required: true })
  totalAmount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  subtotalAmount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  taxAmount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  taxRate: number;

  @ApiProperty()
  @Prop({ default: 0 })
  cgstRate: number;

  @ApiProperty()
  @Prop({ default: 0 })
  sgstRate: number;

  @ApiProperty()
  @Prop({ default: 0 })
  cgstAmount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  sgstAmount: number;

  @ApiProperty()
  @Prop({ default: 'exclusive' })
  taxType: string;

  @ApiProperty()
  @Prop({ default: 0 })
  vatAmount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  vatRate: number;

  @ApiProperty()
  @Prop({ default: 'exclusive' })
  vatType: string;

  @ApiProperty()
  @Prop({ default: 0 })
  foodSubtotal: number;

  @ApiProperty()
  @Prop({ default: 0 })
  liquorSubtotal: number;

  @ApiProperty({ required: false })
  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: false })
  couponId?: Types.ObjectId;

  @ApiProperty({ required: false })
  @Prop()
  couponCode?: string;

  @ApiProperty({ default: 0 })
  @Prop({ default: 0 })
  discountAmount: number;

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
