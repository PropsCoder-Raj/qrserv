import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CouponCustomizationOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  priceDelta?: number;
}

class CouponOrderItemDto {
  @ApiProperty()
  @IsMongoId()
  menuItemId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CouponCustomizationOptionDto)
  spiceLevel?: CouponCustomizationOptionDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CouponCustomizationOptionDto)
  addOns?: CouponCustomizationOptionDto[];

  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class ValidateCouponDto {
  @ApiProperty()
  @IsMongoId()
  restaurantId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ type: [CouponOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CouponOrderItemDto)
  items: CouponOrderItemDto[];
}
