import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ManualDiscountType, PaymentMethod, PaymentStatus } from '../../../schemas/order.schema';

export class SelectedAddOnDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  priceDelta?: number;
}

export class SelectedSpiceLevelDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  priceDelta?: number;
}

export class OrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  menuItemId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemType?: string;

  @ApiPropertyOptional({ type: SelectedSpiceLevelDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SelectedSpiceLevelDto)
  spiceLevel?: SelectedSpiceLevelDto;

  @ApiPropertyOptional({ type: [SelectedAddOnDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedAddOnDto)
  addOns?: SelectedAddOnDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tableId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiPropertyOptional({
    enum: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.ONLINE],
    default: PaymentMethod.CASH,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn([
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.ONLINE,
    'cash',
    'card',
    'online',
  ])
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: [PaymentStatus.PENDING, PaymentStatus.PAID] })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsIn([PaymentStatus.PENDING, PaymentStatus.PAID, 'PENDING', 'PAID', 'pending', 'paid'])
  paymentStatus?: PaymentStatus;

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

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}
