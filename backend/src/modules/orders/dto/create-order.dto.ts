import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiPropertyOptional({ example: 'cash' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

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
