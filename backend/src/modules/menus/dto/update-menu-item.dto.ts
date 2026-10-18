import { PartialType, OmitType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';
import { CreateMenuItemDto } from './create-menu-item.dto';

export class UpdateMenuItemDto extends PartialType(
  OmitType(CreateMenuItemDto, ['restaurantId', 'categoryId'] as const),
) {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: '60d0fe4f5311236168a109ca' })
  @IsOptional()
  @IsString()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'URL of the menu item image or null to remove',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({
    description: 'Set to true to remove the existing image',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  remove_image?: boolean;

  @ApiPropertyOptional({
    description: 'Alias for remove_image',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  removeImage?: boolean;
}

