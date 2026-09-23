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
exports.TablesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tables_service_1 = require("./tables.service");
const create_table_dto_1 = require("./dto/create-table.dto");
const update_table_dto_1 = require("./dto/update-table.dto");
const decorators_1 = require("../../common/decorators");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let TablesController = class TablesController {
    constructor(tablesService) {
        this.tablesService = tablesService;
    }
    async create(dto, user, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            await this.tablesService.validateOrgRestaurant(dto.restaurantId, organizationId);
        }
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            dto.restaurantId = userRestaurantId;
        }
        return this.tablesService.create(dto, organizationId);
    }
    async findAll(restaurantId, query, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId && restaurantId) {
            await this.tablesService.validateOrgRestaurant(restaurantId, organizationId);
        }
        if (role === decorators_1.Role.RESTAURANT_OWNER && userRestaurantId) {
            restaurantId = userRestaurantId;
        }
        return this.tablesService.findAll(restaurantId, query);
    }
    getPublicInfo(id) {
        return this.tablesService.getPublicInfo(id);
    }
    findOne(id) {
        return this.tablesService.findOne(id);
    }
    update(id, dto) {
        return this.tablesService.update(id, dto);
    }
    remove(id) {
        return this.tablesService.remove(id);
    }
};
exports.TablesController = TablesController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a table' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __param(4, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_table_dto_1.CreateTableDto, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get tables by restaurant' }),
    __param(0, (0, common_1.Query)('restaurantId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __param(4, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto, String, String, String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "findAll", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':id/info'),
    (0, swagger_1.ApiOperation)({ summary: 'Get basic table info by ID (public)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TablesController.prototype, "getPublicInfo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a table by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TablesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a table' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_table_dto_1.UpdateTableDto]),
    __metadata("design:returntype", void 0)
], TablesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a table' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TablesController.prototype, "remove", null);
exports.TablesController = TablesController = __decorate([
    (0, swagger_1.ApiTags)('Tables'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/tables'),
    __metadata("design:paramtypes", [tables_service_1.TablesService])
], TablesController);
//# sourceMappingURL=tables.controller.js.map