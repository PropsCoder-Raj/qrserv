import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ItemType {
  FOOD = 'food',
  LIQUOR = 'liquor',
}

@Schema({ _id: false })
export class CustomizationOption {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiPropertyOptional()
  @Prop({ default: '' })
  emoji: string;

  @ApiPropertyOptional({ default: 0 })
  @Prop({ default: 0 })
  priceDelta: number;
}
export const CustomizationOptionSchema =
  SchemaFactory.createForClass(CustomizationOption);

@Schema({ _id: false })
export class MenuItemCustomization {
  @ApiPropertyOptional({ type: [CustomizationOption] })
  @Prop({ type: [CustomizationOptionSchema], default: [] })
  spiceLevels: CustomizationOption[];

  @ApiPropertyOptional({ type: [CustomizationOption] })
  @Prop({ type: [CustomizationOptionSchema], default: [] })
  addOns: CustomizationOption[];

  @ApiPropertyOptional({ default: true })
  @Prop({ default: true })
  allowSpecialInstructions: boolean;
}
export const MenuItemCustomizationSchema = SchemaFactory.createForClass(
  MenuItemCustomization,
);

@Schema({ timestamps: true })
export class MenuItem {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiPropertyOptional()
  @Prop()
  ingredients: string;

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

  @ApiPropertyOptional({ type: MenuItemCustomization })
  @Prop({ type: MenuItemCustomizationSchema, default: () => ({}) })
  customization: MenuItemCustomization;
}

export type MenuItemDocument = MenuItem & Document;
export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
