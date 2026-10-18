import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ManualDiscountType } from '../../../schemas/order.schema';
import { OrderItemDto } from './create-order.dto';

export class UpdateOrderItemsDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 'SAVE10' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    enum: ManualDiscountType,
    example: ManualDiscountType.PERCENTAGE,
  })
  @IsOptional()
  @IsIn([ManualDiscountType.PERCENTAGE, ManualDiscountType.FIXED, 'percentage', 'fixed', null, ''])
  manualDiscountType?: ManualDiscountType | string | null;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  manualDiscountValue?: number;

  @ApiPropertyOptional({ example: 'Manager courtesy' })
  @IsOptional()
  @IsString()
  manualDiscountReason?: string;

  @ApiPropertyOptional({
    enum: ManualDiscountType,
    example: ManualDiscountType.PERCENTAGE,
  })
  @IsOptional()
  @IsIn([ManualDiscountType.PERCENTAGE, ManualDiscountType.FIXED, 'percentage', 'fixed', null, ''])
  manual_discount_type?: ManualDiscountType | string | null;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  manual_discount_value?: number;

  @ApiPropertyOptional({ example: 'Manager courtesy' })
  @IsOptional()
  @IsString()
  manual_discount_reason?: string;
}