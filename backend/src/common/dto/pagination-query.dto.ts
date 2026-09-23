import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsIn,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DATE_PRESETS, DatePreset } from './date-filter.dto';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    enum: DATE_PRESETS,
    description:
      'Date range preset for filtering results. Applied on createdAt for most collections, and purchasedAt for subscription history.',
  })
  @IsOptional()
  @IsIn(DATE_PRESETS as unknown as string[])
  datePreset?: DatePreset;

  @ApiPropertyOptional({
    description:
      'Start date for explicit date range filtering in YYYY-MM-DD or ISO format.',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description:
      'End date for explicit date range filtering in YYYY-MM-DD or ISO format.',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Filter records by table id.',
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  tableId?: string;
}
