import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentSchemaStatus {
  CREATED = 'created',
  CAPTURED = 'captured',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Payment {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @ApiProperty()
  @Prop()
  razorpayOrderId: string;

  @ApiProperty()
  @Prop()
  razorpayPaymentId: string;

  @ApiProperty()
  @Prop()
  razorpaySignature: string;

  @ApiProperty()
  @Prop({ required: true })
  amount: number;

  @ApiProperty()
  @Prop({ default: 'INR' })
  currency: string;

  @ApiProperty({ enum: PaymentSchemaStatus })
  @Prop({ enum: PaymentSchemaStatus, default: PaymentSchemaStatus.CREATED })
  status: PaymentSchemaStatus;
}

export type PaymentDocument = Payment & Document;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
