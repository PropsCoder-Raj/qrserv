import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { RestaurantType, TaxType } from '../../../schemas/restaurant.schema';

export class CreateRestaurantDto {
  @ApiProperty({ description: 'Organization ID this restaurant belongs to' })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ example: 'My Restaurant' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  owner_name: string;

  @ApiProperty({ example: 'dining', enum: RestaurantType })
  @IsNotEmpty()
  @IsEnum(RestaurantType)
  restaurant_type: RestaurantType;

  @ApiPropertyOptional({ example: 'A great restaurant' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @ValidateIf((o) => o.phone !== '' && o.phone != null)
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone must be a 10-digit number starting with 6, 7, 8 or 9',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'info@restaurant.com' })
  @IsOptional()
  @ValidateIf((o) => o.email !== '' && o.email != null)
  @IsEmail({}, { message: 'Enter a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: '22AAAAA0000A1Z5' })
  @IsOptional()
  @IsString()
  gst_no?: string;

  @ApiPropertyOptional({ example: 'VAT123456' })
  @IsOptional()
  @IsString()
  vat_no?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ example: 'inclusive', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  vatEnabled?: boolean;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;

  @ApiPropertyOptional({ example: 'inclusive', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  vatType?: TaxType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
