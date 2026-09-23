import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ItemType } from '../../../schemas/menu-item.schema';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Paneer Tikka' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Grilled cottage cheese with spices' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 250 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

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
}
