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
exports.CreateRestaurantDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const restaurant_schema_1 = require("../../../schemas/restaurant.schema");
class CreateRestaurantDto {
}
exports.CreateRestaurantDto = CreateRestaurantDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organization ID this restaurant belongs to' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'My Restaurant' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "owner_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'dining', enum: restaurant_schema_1.RestaurantType }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(restaurant_schema_1.RestaurantType),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "restaurant_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'A great restaurant' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123 Main Street' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '9876543210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => o.phone !== '' && o.phone != null),
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/, {
        message: 'Phone must be a 10-digit number starting with 6, 7, 8 or 9',
    }),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'info@restaurant.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => o.email !== '' && o.email != null),
    (0, class_validator_1.IsEmail)({}, { message: 'Enter a valid email address' }),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '22AAAAA0000A1Z5' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "gst_no", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'VAT123456' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "vat_no", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRestaurantDto.prototype, "taxEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateRestaurantDto.prototype, "taxRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'inclusive', enum: restaurant_schema_1.TaxType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(restaurant_schema_1.TaxType),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "taxType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRestaurantDto.prototype, "vatEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateRestaurantDto.prototype, "vatRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'inclusive', enum: restaurant_schema_1.TaxType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(restaurant_schema_1.TaxType),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "vatType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRestaurantDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-restaurant.dto.js.map