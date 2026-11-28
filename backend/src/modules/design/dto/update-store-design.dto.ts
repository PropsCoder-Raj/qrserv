import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  DesignBorderRadius,
  DesignButtonStyle,
  DesignFontFamily,
  DesignItemViewMode,
  StoreTheme,
} from '../../../schemas/store-design.schema';

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
const HEX_COLOR_MSG = 'Must be a valid hex color code (e.g. #E11D48)';

export class ClassicColorsDto {
  @ApiPropertyOptional({ example: '#E11D48' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: `primary: ${HEX_COLOR_MSG}` })
  primary?: string;

  @ApiPropertyOptional({ example: '#FB7185' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: `secondary: ${HEX_COLOR_MSG}` })
  secondary?: string;

  @ApiPropertyOptional({ example: '#FAF8F5' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: `background: ${HEX_COLOR_MSG}` })
  background?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: `surface: ${HEX_COLOR_MSG}` })
  surface?: string;

  @ApiPropertyOptional({ example: '#1E293B' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: `textPrimary: ${HEX_COLOR_MSG}` })
  textPrimary?: string;

  @ApiPropertyOptional({ example: '#64748B' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: `textMuted: ${HEX_COLOR_MSG}` })
  textMuted?: string;
}

export class ClassicTypographyDto {
  @ApiPropertyOptional({ enum: DesignFontFamily })
  @IsOptional()
  @IsEnum(DesignFontFamily)
  fontFamily?: DesignFontFamily;
}

export class ClassicShapeDto {
  @ApiPropertyOptional({ enum: DesignBorderRadius })
  @IsOptional()
  @IsEnum(DesignBorderRadius)
  borderRadius?: DesignBorderRadius;

  @ApiPropertyOptional({ enum: DesignButtonStyle })
  @IsOptional()
  @IsEnum(DesignButtonStyle)
  buttonStyle?: DesignButtonStyle;
}

export class ClassicLayoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showBanner?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @ApiPropertyOptional({ enum: DesignItemViewMode })
  @IsOptional()
  @IsEnum(DesignItemViewMode)
  itemViewMode?: DesignItemViewMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showDietaryBadges?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showDescriptions?: boolean;
}

export class ClassicConfigDto {
  @ApiPropertyOptional({ type: ClassicColorsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClassicColorsDto)
  colors?: ClassicColorsDto;

  @ApiPropertyOptional({ type: ClassicTypographyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClassicTypographyDto)
  typography?: ClassicTypographyDto;

  @ApiPropertyOptional({ type: ClassicShapeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClassicShapeDto)
  shape?: ClassicShapeDto;

  @ApiPropertyOptional({ type: ClassicLayoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClassicLayoutDto)
  layout?: ClassicLayoutDto;
}

export class UpdateStoreDesignDto {
  @ApiPropertyOptional({ enum: StoreTheme, default: StoreTheme.CLASSIC })
  @IsOptional()
  @IsEnum(StoreTheme)
  activeTheme?: StoreTheme;

  @ApiPropertyOptional({ type: ClassicConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClassicConfigDto)
  classicConfig?: ClassicConfigDto;
}
