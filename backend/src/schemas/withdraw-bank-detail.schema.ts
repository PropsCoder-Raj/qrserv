import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export enum WithdrawBankDetailType {
  PERSONAL = 'personal',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class WithdrawBankDetail {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ enum: WithdrawBankDetailType, default: WithdrawBankDetailType.PERSONAL })
  @Prop({
    enum: WithdrawBankDetailType,
    default: WithdrawBankDetailType.PERSONAL,
    required: true,
    trim: true,
  })
  bankDetailType: WithdrawBankDetailType;

  @ApiPropertyOptional()
  @Prop({ default: '', trim: true })
  customBankDetailLabel: string;

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
}

export type WithdrawBankDetailDocument = WithdrawBankDetail & Document;
export const WithdrawBankDetailSchema =
  SchemaFactory.createForClass(WithdrawBankDetail);

WithdrawBankDetailSchema.index(
  { organizationId: 1, userId: 1, accountNumber: 1, ifscCode: 1 },
  { unique: true },
);
