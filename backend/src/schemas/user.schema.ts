import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  RESTAURANT_OWNER = 'restaurant_owner',
  MANAGER = 'manager',
  STAFF = 'staff',
}

@Schema({ timestamps: true })
export class User {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  passcode: string;

  @ApiProperty()
  @Prop()
  phone: string;

  @ApiProperty({ enum: UserRole })
  @Prop({ required: true, enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  organizationId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', default: null })
  restaurantId: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  refreshToken: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
