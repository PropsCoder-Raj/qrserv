import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ItemType,
  PriceDropType,
} from '../../../schemas/menu-item.schema';

export class CustomizationOptionDto {
  @ApiProperty({ example: 'Extra Cheese' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '🧀' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ example: 20, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  priceDelta?: number;
}

export class MenuItemCustomizationDto {
  @ApiPropertyOptional({ type: [CustomizationOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionDto)
  spiceLevels?: CustomizationOptionDto[];

  @ApiPropertyOptional({ type: [CustomizationOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionDto)
  addOns?: CustomizationOptionDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowSpecialInstructions?: boolean;
}

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Paneer Tikka' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Grilled cottage cheese with spices' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Paneer, yogurt, ginger, garlic, spices' })
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiProperty({ example: 250 })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: PriceDropType })
  @IsOptional()
  @IsEnum(PriceDropType)
  discountType?: PriceDropType | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  categoryId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  restaurantId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVeg?: boolean;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  preparationTime?: number;

  @ApiPropertyOptional({ example: 'food', enum: ItemType })
  @IsOptional()
  @IsEnum(ItemType)
  itemType?: ItemType;

  @ApiPropertyOptional({ example: 5, description: 'Per-item GST rate (%). 0 means no GST' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  gstRate?: number;

  @ApiPropertyOptional({ example: 15, description: 'Per-item VAT rate (%). 0 means no VAT' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;

  @ApiPropertyOptional({ type: MenuItemCustomizationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MenuItemCustomizationDto)
  customization?: MenuItemCustomizationDto;
}
