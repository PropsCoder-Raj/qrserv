import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { mongoose3DecimalSetter } from '../common/utils/precision';

export enum WithdrawRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class WithdrawRequest {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedByUserId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, min: 0.001, type: Number, set: mongoose3DecimalSetter })
  amount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  chargePercentage: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  chargeBaseAmount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  chargeGstPercentage: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  chargeGstAmount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  chargeAmount: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number, set: mongoose3DecimalSetter })
  netAmount: number;

  @ApiProperty()
  @Prop({ default: '' })
  note: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'WithdrawBankDetail', default: null })
  bankDetailId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  accountHolderName: string;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  bankName: string;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  accountNumber: string;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  ifscCode: string;

  @ApiProperty({ enum: WithdrawRequestStatus, default: WithdrawRequestStatus.PENDING })
  @Prop({
    enum: WithdrawRequestStatus,
    default: WithdrawRequestStatus.PENDING,
  })
  status: WithdrawRequestStatus;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedByUserId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: null })
  approvedAt: Date;

  @ApiProperty()
  @Prop({ default: '' })
  approvalNote: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  paidByUserId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: null })
  paidAt: Date;

  @ApiProperty()
  @Prop({ default: '' })
  paymentReference: string;

  @ApiProperty()
  @Prop({ default: '' })
  paymentNote: string;

  @ApiProperty()
  @Prop({ default: '' })
  paymentProofUrl: string;

  @ApiProperty()
  @Prop({ default: '' })
  paymentProofName: string;
}

export type WithdrawRequestDocument = WithdrawRequest & Document;
export const WithdrawRequestSchema =
  SchemaFactory.createForClass(WithdrawRequest);
