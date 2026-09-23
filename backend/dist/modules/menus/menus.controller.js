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
exports.MenusController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const menus_service_1 = require("./menus.service");
const create_category_dto_1 = require("./dto/create-category.dto");
const update_category_dto_1 = require("./dto/update-category.dto");
const create_menu_item_dto_1 = require("./dto/create-menu-item.dto");
const update_menu_item_dto_1 = require("./dto/update-menu-item.dto");
const decorators_1 = require("../../common/decorators");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let MenusController = class MenusController {
    constructor(menusService) {
        this.menusService = menusService;
    }
    getFullMenu(restaurantId) {
        return this.menusService.getFullMenu(restaurantId);
    }
    async createCategory(dto, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            await this.menusService.validateOrgRestaurant(dto.restaurantId, organizationId);
        }
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            dto.restaurantId = userRestaurantId;
        }
        return this.menusService.createCategory(dto, organizationId);
    }
    async findCategories(restaurantId, includeInactive, query, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId && restaurantId) {
            await this.menusService.validateOrgRestaurant(restaurantId, organizationId);
        }
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            restaurantId = userRestaurantId;
        }
        return this.menusService.findCategories(restaurantId, query, includeInactive === 'true');
    }
    updateCategory(id, dto) {
        return this.menusService.updateCategory(id, dto);
    }
    removeCategory(id) {
        return this.menusService.removeCategory(id);
    }
    async createMenuItem(dto, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            await this.menusService.validateOrgRestaurant(dto.restaurantId, organizationId);
        }
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            dto.restaurantId = userRestaurantId;
        }
        return this.menusService.createMenuItem(dto, organizationId);
    }
    async findMenuItems(restaurantId, categoryId, includeInactive, query, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId && restaurantId) {
            await this.menusService.validateOrgRestaurant(restaurantId, organizationId);
        }
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            restaurantId = userRestaurantId;
        }
        return this.menusService.findMenuItems(restaurantId, categoryId, query, includeInactive === 'true');
    }
    updateMenuItem(id, dto) {
        return this.menusService.updateMenuItem(id, dto);
    }
    uploadMenuItemImage(id, file) {
        return this.menusService.uploadMenuItemImage(id, file);
    }
    removeMenuItem(id) {
        return this.menusService.removeMenuItem(id);
    }
};
exports.MenusController = MenusController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('menu/:restaurantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full menu by restaurant (public)' }),
    __param(0, (0, common_1.Param)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenusController.prototype, "getFullMenu", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a category' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __param(3, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_category_dto_1.CreateCategoryDto, String, String, String]),
    __metadata("design:returntype", Promise)
], MenusController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get categories by restaurant' }),
    __param(0, (0, common_1.Query)('restaurantId')),
    __param(1, (0, common_1.Query)('includeInactive')),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, decorators_1.CurrentUser)('role')),
    __param(4, (0, decorators_1.CurrentUser)('organizationId')),
    __param(5, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, pagination_query_dto_1.PaginationQueryDto, String, String, String]),
    __metadata("design:returntype", Promise)
], MenusController.prototype, "findCategories", null);
__decorate([
    (0, common_1.Patch)('categories/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a category' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_category_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", void 0)
], MenusController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a category' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenusController.prototype, "removeCategory", null);
__decorate([
    (0, common_1.Post)('menu-items'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a menu item' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __param(3, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_menu_item_dto_1.CreateMenuItemDto, String, String, String]),
    __metadata("design:returntype", Promise)
], MenusController.prototype, "createMenuItem", null);
__decorate([
    (0, common_1.Get)('menu-items'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get menu items by restaurant' }),
    __param(0, (0, common_1.Query)('restaurantId')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('includeInactive')),
    __param(3, (0, common_1.Query)()),
    __param(4, (0, decorators_1.CurrentUser)('role')),
    __param(5, (0, decorators_1.CurrentUser)('organizationId')),
    __param(6, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, pagination_query_dto_1.PaginationQueryDto, String, String, String]),
    __metadata("design:returntype", Promise)
], MenusController.prototype, "findMenuItems", null);
__decorate([
    (0, common_1.Patch)('menu-items/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a menu item' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_menu_item_dto_1.UpdateMenuItemDto]),
    __metadata("design:returntype", void 0)
], MenusController.prototype, "updateMenuItem", null);
__decorate([
    (0, common_1.Post)('menu-items/:id/image'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Upload or replace a menu item image' }),
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
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowedMimeTypes = [
                'image/png',
                'image/jpeg',
                'image/jpg',
                'image/webp',
            ];
            if (!allowedMimeTypes.includes(file?.mimetype)) {
                return cb(new Error('Only PNG, JPG, JPEG, and WEBP files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MenusController.prototype, "uploadMenuItemImage", null);
__decorate([
    (0, common_1.Delete)('menu-items/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a menu item' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenusController.prototype, "removeMenuItem", null);
exports.MenusController = MenusController = __decorate([
    (0, swagger_1.ApiTags)('Menus'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [menus_service_1.MenusService])
], MenusController);
//# sourceMappingURL=menus.controller.js.map