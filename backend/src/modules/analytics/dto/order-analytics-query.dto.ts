import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';
import { DATE_PRESETS, DatePreset } from '../../../common/dto/date-filter.dto';

export class OrderAnalyticsQueryDto {
  @ApiPropertyOptional({
    description:
      'Restaurant to scope the analytics to. Omit to view "All Restaurants" (super admin/org admin only).',
  })
  @IsOptional()
  @IsMongoId()
  restaurant_id?: string;

  @ApiPropertyOptional({
    enum: DATE_PRESETS,
    description:
      'Date range preset (e.g. today, yesterday, last7Days, thisMonth, custom). Ignored when start_date/end_date are provided.',
  })
  @IsOptional()
  @IsIn(DATE_PRESETS as unknown as string[])
  datePreset?: DatePreset;

  @ApiPropertyOptional({
    description:
      'Custom range start date (YYYY-MM-DD or ISO). Used together with end_date.',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description:
      'Custom range end date (YYYY-MM-DD or ISO). Used together with start_date.',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment status: all, paid, pending, failed, cod.',
  })
  @IsOptional()
  @IsString()
  payment_status?: string;

  @ApiPropertyOptional({
    description:
      'Filter by fulfillment method / order type: all, dine_in, takeaway, delivery.',
  })
  @IsOptional()
  @IsString()
  fulfillment_method?: string;

  @ApiPropertyOptional({
    description: 'Alias for fulfillment_method.',
  })
  @IsOptional()
  @IsString()
  order_type?: string;
}
