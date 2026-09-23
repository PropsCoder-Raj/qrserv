export declare const DATE_PRESETS: readonly ["today", "yesterday", "last7Days", "last30Days", "last90Days", "thisMonth", "lastMonth", "thisYear"];
export type DatePreset = (typeof DATE_PRESETS)[number];
export declare class DateFilterDto {
    datePreset?: DatePreset;
}
