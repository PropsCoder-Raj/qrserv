import { DatePreset } from './date-filter.dto';
export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    datePreset?: DatePreset;
    fromDate?: string;
    toDate?: string;
    tableId?: string;
}
