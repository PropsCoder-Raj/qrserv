"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateFilterDto = exports.DATE_PRESETS = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.DATE_PRESETS = [
    'today',
    'yesterday',
    'last7Days',
    'last30Days',
    'last90Days',
    'thisMonth',
    'lastMonth',
    'thisYear',
];
class DateFilterDto {
}
exports.DateFilterDto = DateFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: exports.DATE_PRESETS,
        description: 'Date range preset. Applied on createdAt for most collections, and purchasedAt for subscription history.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.DATE_PRESETS),
    __metadata("design:type", String)
], DateFilterDto.prototype, "datePreset", void 0);
//# sourceMappingURL=date-filter.dto.js.map