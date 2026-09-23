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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const decorators_1 = require("../../common/decorators");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(createUserDto, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            if (createUserDto.restaurantId) {
                await this.usersService.validateOrgRestaurant(createUserDto.restaurantId, organizationId);
            }
            createUserDto.organizationId = organizationId;
        }
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            createUserDto.restaurantId = userRestaurantId;
        }
        return this.usersService.create(createUserDto);
    }
    findAll(restaurantId, query, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.ORG_ADMIN) {
            if (!organizationId) {
                return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
            }
            return this.usersService.findAll(undefined, query, organizationId);
        }
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            return this.usersService.findAll(userRestaurantId, query);
        }
        return this.usersService.findAll(restaurantId, query);
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    async update(id, updateUserDto, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            await this.usersService.validateOrgUser(id, organizationId);
        }
        return this.usersService.update(id, updateUserDto);
    }
    async remove(id, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            await this.usersService.validateOrgUser(id, organizationId);
        }
        return this.usersService.remove(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __param(3, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users' }),
    __param(0, (0, common_1.Query)('restaurantId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __param(4, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto, String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a user by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map