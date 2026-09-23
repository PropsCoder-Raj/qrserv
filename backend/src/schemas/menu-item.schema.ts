import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum ItemType {
  FOOD = 'food',
  LIQUOR = 'liquor',
}

@Schema({ timestamps: true })
export class MenuItem {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiProperty()
  @Prop({ required: true })
  price: number;

  @ApiProperty()
  @Prop()
  image: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: false })
  isVeg: boolean;

  @ApiProperty()
  @Prop({ default: true })
  isAvailable: boolean;

  @ApiProperty()
  @Prop({ default: 15 })
  preparationTime: number;

  @ApiProperty({ enum: ItemType })
  @Prop({ enum: ItemType, default: ItemType.FOOD })
  itemType: ItemType;
}

export type MenuItemDocument = MenuItem & Document;
export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
