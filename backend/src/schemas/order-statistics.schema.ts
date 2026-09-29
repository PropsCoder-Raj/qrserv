import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class OrderStatistics {
  @ApiProperty()
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @ApiProperty()
  @Prop({
    type: Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true,
  })
  restaurantId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: 0 })
  pendingOrderCount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  confirmedOrderCount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  preparingOrderCount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  readyOrderCount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  servedOrderCount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  cancelledOrderCount: number;

  @ApiProperty()
  @Prop({ default: 0 })
  totalOrderAmount: number;
}

export type OrderStatisticsDocument = OrderStatistics & Document;
export const OrderStatisticsSchema =
  SchemaFactory.createForClass(OrderStatistics);

// One statistics record per organization + restaurant combination.
OrderStatisticsSchema.index({ orgId: 1, restaurantId: 1 }, { unique: true });
