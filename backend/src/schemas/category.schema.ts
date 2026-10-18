import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Category {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiProperty()
  @Prop()
  image: string;

  @ApiProperty()
  @Prop({ default: 0 })
  sortOrder: number;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;
}

export type CategoryDocument = Category & Document;
export const CategorySchema = SchemaFactory.createForClass(Category);
