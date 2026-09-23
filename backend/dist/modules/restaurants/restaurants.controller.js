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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const restaurants_service_1 = require("./restaurants.service");
const create_restaurant_dto_1 = require("./dto/create-restaurant.dto");
const update_restaurant_dto_1 = require("./dto/update-restaurant.dto");
const decorators_1 = require("../../common/decorators");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let RestaurantsController = class RestaurantsController {
    constructor(restaurantsService) {
        this.restaurantsService = restaurantsService;
    }
    create(createRestaurantDto, userId, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            createRestaurantDto.organizationId = organizationId;
        }
        return this.restaurantsService.create(createRestaurantDto, userId);
    }
    findAll(query, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            return this.restaurantsService.findAll(query, organizationId);
        }
        return this.restaurantsService.findAll(query);
    }
    findMyRestaurants(userId, organizationId, userRestaurantId, role, query) {
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            return this.restaurantsService.findByRestaurantId(userRestaurantId);
        }
        return this.restaurantsService.findByOwner(userId, query, organizationId);
    }
    findBySlug(slug) {
        return this.restaurantsService.findBySlug(slug);
    }
    getPublicInfo(id) {
        return this.restaurantsService.getPublicInfo(id);
    }
    findOne(id) {
        return this.restaurantsService.findOne(id);
    }
    async update(id, updateRestaurantDto, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            await this.restaurantsService.validateOrgRestaurant(id, organizationId);
        }
        return this.restaurantsService.update(id, updateRestaurantDto);
    }
    remove(id) {
        return this.restaurantsService.remove(id);
    }
    async uploadMenuPdf(id, file, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            await this.restaurantsService.validateOrgRestaurant(id, organizationId);
        }
        return this.restaurantsService.uploadMenuPdf(id, file);
    }
};
exports.RestaurantsController = RestaurantsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new restaurant' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_restaurant_dto_1.CreateRestaurantDto, String, String, String]),
    __metadata("design:returntype", void 0)
], RestaurantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all restaurants' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto, String, String]),
    __metadata("design:returntype", void 0)
], RestaurantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get restaurants owned by current user' }),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __param(1, (0, decorators_1.CurrentUser)('organizationId')),
    __param(2, (0, decorators_1.CurrentUser)('restaurantId')),
    __param(3, (0, decorators_1.CurrentUser)('role')),
    __param(4, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], RestaurantsController.prototype, "findMyRestaurants", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get restaurant by slug (public)' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RestaurantsController.prototype, "findBySlug", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':id/info'),
    (0, swagger_1.ApiOperation)({ summary: 'Get basic restaurant info by ID (public)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RestaurantsController.prototype, "getPublicInfo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a restaurant by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RestaurantsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a restaurant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_restaurant_dto_1.UpdateRestaurantDto, String, String]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a restaurant' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RestaurantsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/menu-pdf'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload/replace a restaurant menu PDF (single doc per restaurant)',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
            required: ['file'],
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file?.mimetype !== 'application/pdf') {
                return cb(new Error('Only PDF files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "uploadMenuPdf", null);
exports.RestaurantsController = RestaurantsController = __decorate([
    (0, swagger_1.ApiTags)('Restaurants'),
    (0, common_1.Controller)('api/restaurants'),
    __metadata("design:paramtypes", [restaurants_service_1.RestaurantsService])
], RestaurantsController);
//# sourceMappingURL=restaurants.controller.js.map