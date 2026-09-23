import { DatePreset } from '../dto/date-filter.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
export type DateRange = {
    from: Date;
    to: Date;
};
export declare function getDateRangeFromPreset(preset?: DatePreset, now?: Date): DateRange | undefined;
export declare function getDateRangeFromQuery(query?: Pick<PaginationQueryDto, 'datePreset' | 'fromDate' | 'toDate'>, now?: Date): DateRange | undefined;
