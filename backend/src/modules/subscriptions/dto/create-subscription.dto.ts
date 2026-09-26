import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubscriptionOfferDto {
  @ApiProperty({ example: 3, description: 'Offer applies for X months' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  months: number;

  @ApiProperty({ example: 50, description: 'Percentage discount (0-100)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  offerPercent: number;
}

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'Basic Plan' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 999 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    example: 'none',
    enum: ['none', 'flat', 'percentage'],
    description: 'Discount type to apply on price',
  })
  @IsOptional()
  @IsIn(['none', 'flat', 'percentage'])
  discountType?: 'none' | 'flat' | 'percentage';

  @ApiPropertyOptional({
    example: 10,
    description:
      'Discount value. When discountType=flat =>  amount. When percentage => 0-100.',
  })
  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @ApiPropertyOptional({
    example: false,
    description:
      'Whether this plan should use payment gateway based purchase flow.',
  })
  @IsOptional()
  @IsBoolean()
  isPaymentGatewayAllocated?: boolean;

  @ApiPropertyOptional({
    example: false,
    description:
      'Whether this plan should allow restaurant menu PDF upload and PDF QR usage.',
  })
  @IsOptional()
  @IsBoolean()
  isMenuPdfEnabled?: boolean;

  @ApiProperty({ example: 30, description: 'Duration in days' })
  @IsNotEmpty()
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  maxTables?: number;

  @ApiPropertyOptional({ example: 50, description: '0 = unlimited' })
  @IsOptional()
  @IsNumber()
  maxMenuItems?: number;

  @ApiPropertyOptional({ example: 0, description: '0 = unlimited' })
  @IsOptional()
  @IsNumber()
  maxCategories?: number;

  @ApiPropertyOptional({ example: 5, description: '0 = unlimited' })
  @IsOptional()
  @IsNumber()
  maxRestaurants?: number;

  @ApiPropertyOptional({
    example: 'none',
    enum: ['none', 'optional', 'included'],
  })
  @IsOptional()
  @IsIn(['none', 'optional', 'included'])
  customerDataAccess?: string;

  @ApiPropertyOptional({ example: ['QR Codes', 'Order Management'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    type: [SubscriptionOfferDto],
    description:
      'Month-based offers. Example: [{months:3, offerPercent:50},{months:5, offerPercent:70}]',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionOfferDto)
  offers?: SubscriptionOfferDto[];
}
