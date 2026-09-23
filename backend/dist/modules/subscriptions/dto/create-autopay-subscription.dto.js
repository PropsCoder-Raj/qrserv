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
exports.CreateAutopaySubscriptionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAutopaySubscriptionDto {
}
exports.CreateAutopaySubscriptionDto = CreateAutopaySubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the subscription plan to subscribe to' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAutopaySubscriptionDto.prototype, "subscriptionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Selected duration in months for the purchase (for offers/discount calculation). Defaults to 1 if omitted.',
        required: false,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateAutopaySubscriptionDto.prototype, "months", void 0);
//# sourceMappingURL=create-autopay-subscription.dto.js.map