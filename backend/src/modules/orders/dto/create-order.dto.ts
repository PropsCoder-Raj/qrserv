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
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '../../../schemas/order.schema';

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
  @IsNumber()
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
  @IsNumber()
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
  @IsNumber()
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
    enum: [PaymentMethod.CASH, PaymentMethod.CARD],
    default: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsIn([PaymentMethod.CASH, PaymentMethod.CARD])
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: [PaymentStatus.PENDING, PaymentStatus.PAID] })
  @IsOptional()
  @IsIn([PaymentStatus.PENDING, PaymentStatus.PAID])
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 'SAVE10' })
  @IsOptional()
  @IsString()
  couponCode?: string;

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
