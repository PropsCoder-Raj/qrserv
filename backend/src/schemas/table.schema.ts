import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Table {
  @ApiProperty()
  @Prop({ required: true })
  tableNumber: string;

  @ApiProperty()
  @Prop({ default: 4 })
  capacity: number;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @ApiProperty()
  @Prop()
  qrCode: string;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;
}

export type TableDocument = Table & Document;
export const TableSchema = SchemaFactory.createForClass(Table);
