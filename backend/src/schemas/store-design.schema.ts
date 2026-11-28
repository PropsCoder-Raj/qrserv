import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum StoreTheme {
  CLASSIC = 'classic',
}

export enum DesignFontFamily {
  INTER = 'Inter',
  POPPINS = 'Poppins',
  ROBOTO = 'Roboto',
  PLUS_JAKARTA_SANS = 'Plus Jakarta Sans',
}

export enum DesignBorderRadius {
  NONE = 'none',
  SOFT = 'soft',
  ROUNDED = 'rounded',
}

export enum DesignButtonStyle {
  FILLED = 'filled',
  OUTLINE = 'outline',
  PILL = 'pill',
}

export enum DesignItemViewMode {
  LIST = 'list',
  GRID = 'grid',
}

@Schema({ _id: false })
export class ClassicColorsConfig {
  @ApiProperty({ example: '#E11D48' })
  @Prop({ required: true, default: '#E11D48' })
  primary: string;

  @ApiProperty({ example: '#FB7185' })
  @Prop({ required: true, default: '#FB7185' })
  secondary: string;

  @ApiProperty({ example: '#FAF8F5' })
  @Prop({ required: true, default: '#FAF8F5' })
  background: string;

  @ApiProperty({ example: '#FFFFFF' })
  @Prop({ required: true, default: '#FFFFFF' })
  surface: string;

  @ApiProperty({ example: '#1E293B' })
  @Prop({ required: true, default: '#1E293B' })
  textPrimary: string;

  @ApiProperty({ example: '#64748B' })
  @Prop({ required: true, default: '#64748B' })
  textMuted: string;
}

export const ClassicColorsConfigSchema =
  SchemaFactory.createForClass(ClassicColorsConfig);

@Schema({ _id: false })
export class ClassicTypographyConfig {
  @ApiProperty({ enum: DesignFontFamily, default: DesignFontFamily.INTER })
  @Prop({
    required: true,
    enum: DesignFontFamily,
    default: DesignFontFamily.INTER,
  })
  fontFamily: DesignFontFamily;
}

export const ClassicTypographyConfigSchema = SchemaFactory.createForClass(
  ClassicTypographyConfig,
);

@Schema({ _id: false })
export class ClassicShapeConfig {
  @ApiProperty({ enum: DesignBorderRadius, default: DesignBorderRadius.SOFT })
  @Prop({
    required: true,
    enum: DesignBorderRadius,
    default: DesignBorderRadius.SOFT,
  })
  borderRadius: DesignBorderRadius;

  @ApiProperty({ enum: DesignButtonStyle, default: DesignButtonStyle.FILLED })
  @Prop({
    required: true,
    enum: DesignButtonStyle,
    default: DesignButtonStyle.FILLED,
  })
  buttonStyle: DesignButtonStyle;
}

export const ClassicShapeConfigSchema =
  SchemaFactory.createForClass(ClassicShapeConfig);

@Schema({ _id: false })
export class ClassicLayoutConfig {
  @ApiProperty({ default: true })
  @Prop({ required: true, default: true })
  showBanner: boolean;

  @ApiProperty({ default: true })
  @Prop({ required: true, default: true })
  showLogo: boolean;

  @ApiProperty({ enum: DesignItemViewMode, default: DesignItemViewMode.LIST })
  @Prop({
    required: true,
    enum: DesignItemViewMode,
    default: DesignItemViewMode.LIST,
  })
  itemViewMode: DesignItemViewMode;

  @ApiProperty({ default: true })
  @Prop({ required: true, default: true })
  showDietaryBadges: boolean;

  @ApiProperty({ default: true })
  @Prop({ required: true, default: true })
  showDescriptions: boolean;
}

export const ClassicLayoutConfigSchema =
  SchemaFactory.createForClass(ClassicLayoutConfig);

@Schema({ _id: false })
export class ClassicThemeConfig {
  @ApiProperty({ type: ClassicColorsConfig })
  @Prop({ type: ClassicColorsConfigSchema, default: () => ({}) })
  colors: ClassicColorsConfig;

  @ApiProperty({ type: ClassicTypographyConfig })
  @Prop({ type: ClassicTypographyConfigSchema, default: () => ({}) })
  typography: ClassicTypographyConfig;

  @ApiProperty({ type: ClassicShapeConfig })
  @Prop({ type: ClassicShapeConfigSchema, default: () => ({}) })
  shape: ClassicShapeConfig;

  @ApiProperty({ type: ClassicLayoutConfig })
  @Prop({ type: ClassicLayoutConfigSchema, default: () => ({}) })
  layout: ClassicLayoutConfig;
}

export const ClassicThemeConfigSchema =
  SchemaFactory.createForClass(ClassicThemeConfig);

@Schema({ timestamps: true })
export class StoreDesign {
  @ApiProperty()
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    unique: true,
    index: true,
  })
  restaurantId: Types.ObjectId;

  @ApiProperty({ enum: StoreTheme, default: StoreTheme.CLASSIC })
  @Prop({
    required: true,
    enum: StoreTheme,
    default: StoreTheme.CLASSIC,
  })
  activeTheme: StoreTheme;

  @ApiProperty({ type: ClassicThemeConfig })
  @Prop({ type: ClassicThemeConfigSchema, default: () => ({}) })
  classicConfig: ClassicThemeConfig;

  @ApiProperty({ required: false })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export type StoreDesignDocument = StoreDesign & Document;
export const StoreDesignSchema = SchemaFactory.createForClass(StoreDesign);
