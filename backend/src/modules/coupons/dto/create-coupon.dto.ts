import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CouponDiscountType } from '../../../schemas/coupon.schema';

export class CreateCouponDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  restaurantId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: CouponDiscountType })
  @IsEnum(CouponDiscountType)
  discountType: CouponDiscountType;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  discountValue: number;

  @ApiProperty({ default: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  maxDiscount?: number | null;

  @ApiProperty()
  @IsDateString()
  startAt: string;

  @ApiProperty()
  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
