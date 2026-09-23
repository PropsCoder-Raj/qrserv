import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum RestaurantType {
  SMALL_CART_STALL = 'small cart stall',
  DINING = 'dining',
  KITCHEN = 'kitchen',
}

export enum TaxType {
  INCLUSIVE = 'inclusive',
  EXCLUSIVE = 'exclusive',
}

@Schema({ timestamps: true })
export class Restaurant {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  slug: string;

  @ApiProperty()
  @Prop({ required: true })
  owner_name: string;

  @ApiProperty({ enum: RestaurantType })
  @Prop({
    required: true,
    enum: RestaurantType,
    default: RestaurantType.DINING,
  })
  restaurant_type: RestaurantType;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiProperty()
  @Prop()
  logo: string;

  @ApiProperty()
  @Prop({ required: true })
  address: string;

  @ApiProperty()
  @Prop()
  phone: string;

  @ApiProperty()
  @Prop()
  email: string;

  @ApiProperty()
  @Prop()
  gst_no: string;

  @ApiProperty()
  @Prop()
  vat_no: string;

  @ApiProperty()
  @Prop({ default: false })
  taxEnabled: boolean;

  @ApiProperty()
  @Prop({ default: 0 })
  taxRate: number;

  @ApiProperty({ enum: TaxType })
  @Prop({ enum: TaxType, default: TaxType.INCLUSIVE })
  taxType: TaxType;

  @ApiProperty()
  @Prop({ default: false })
  vatEnabled: boolean;

  @ApiProperty()
  @Prop({ default: 0 })
  vatRate: number;

  @ApiProperty({ enum: TaxType })
  @Prop({ enum: TaxType, default: TaxType.INCLUSIVE })
  vatType: TaxType;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  /**
   * Public URL path to the uploaded menu PDF for this restaurant.
   * Example: /uploads/restaurants/<restaurantId>.pdf
   */
  @ApiProperty({ required: false })
  @Prop()
  menuPdf?: string;
}

export type RestaurantDocument = Restaurant & Document;
export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
