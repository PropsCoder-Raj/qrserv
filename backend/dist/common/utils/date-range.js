"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateRangeFromPreset = getDateRangeFromPreset;
exports.getDateRangeFromQuery = getDateRangeFromQuery;
const common_1 = require("@nestjs/common");
function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}
function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfYear(d) {
    return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}
function getDateRangeFromPreset(preset, now = new Date()) {
    if (!preset)
        return undefined;
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    switch (preset) {
        case 'today': {
            return { from: todayStart, to: todayEnd };
        }
        case 'yesterday': {
            const y = new Date(todayStart);
            y.setDate(y.getDate() - 1);
            return { from: startOfDay(y), to: endOfDay(y) };
        }
        case 'last7Days': {
            const from = new Date(todayStart);
            from.setDate(from.getDate() - 6);
            return { from, to: todayEnd };
        }
        case 'last30Days': {
            const from = new Date(todayStart);
            from.setDate(from.getDate() - 29);
            return { from, to: todayEnd };
        }
        case 'last90Days': {
            const from = new Date(todayStart);
            from.setDate(from.getDate() - 89);
            return { from, to: todayEnd };
        }
        case 'thisMonth': {
            return { from: startOfMonth(now), to: todayEnd };
        }
        case 'lastMonth': {
            const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return { from: startOfMonth(prev), to: endOfMonth(prev) };
        }
        case 'thisYear': {
            return { from: startOfYear(now), to: todayEnd };
        }
        default:
            throw new common_1.BadRequestException('Invalid datePreset');
    }
}
function parseDateInput(value, mode) {
    if (!value)
        return undefined;
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = isDateOnly
        ? new Date(`${value}T${mode === 'start' ? '00:00:00.000' : '23:59:59.999'}`)
        : new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new common_1.BadRequestException(`Invalid ${mode === 'start' ? 'fromDate' : 'toDate'}`);
    }
    return isDateOnly ? date : mode === 'start' ? startOfDay(date) : endOfDay(date);
}
function getDateRangeFromQuery(query, now = new Date()) {
    const from = query?.fromDate ? parseDateInput(query.fromDate, 'start') : undefined;
    const to = query?.toDate ? parseDateInput(query.toDate, 'end') : undefined;
    if (from || to) {
        const range = {
            from: from || new Date(0),
            to: to || endOfDay(now),
        };
        if (range.from > range.to) {
            throw new common_1.BadRequestException('fromDate cannot be greater than toDate');
        }
        return range;
    }
    return getDateRangeFromPreset(query?.datePreset, now);
}
//# sourceMappingURL=date-range.js.map