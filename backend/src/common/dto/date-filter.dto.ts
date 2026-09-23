import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const DATE_PRESETS = [
  'today',
  'yesterday',
  'last7Days',
  'last30Days',
  'last90Days',
  'thisMonth',
  'lastMonth',
  'thisYear',
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

/**
 * Shared date filter contract for list/stats endpoints.
 *
 * Note: We intentionally use presets (instead of raw from/to) to keep UI simple and
 * avoid timezone parsing issues. Server computes the correct range based on local time.
 */
export class DateFilterDto {
  @ApiPropertyOptional({
    enum: DATE_PRESETS,
    description:
      'Date range preset. Applied on createdAt for most collections, and purchasedAt for subscription history.',
  })
  @IsOptional()
  @IsIn(DATE_PRESETS as unknown as string[])
  datePreset?: DatePreset;
}
