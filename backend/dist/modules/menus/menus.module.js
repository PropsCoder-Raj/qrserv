"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenusModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const menus_service_1 = require("./menus.service");
const menus_controller_1 = require("./menus.controller");
const category_schema_1 = require("../../schemas/category.schema");
const menu_item_schema_1 = require("../../schemas/menu-item.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const organization_schema_1 = require("../../schemas/organization.schema");
let MenusModule = class MenusModule {
};
exports.MenusModule = MenusModule;
exports.MenusModule = MenusModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: category_schema_1.Category.name, schema: category_schema_1.CategorySchema },
                { name: menu_item_schema_1.MenuItem.name, schema: menu_item_schema_1.MenuItemSchema },
                { name: restaurant_schema_1.Restaurant.name, schema: restaurant_schema_1.RestaurantSchema },
                { name: organization_schema_1.Organization.name, schema: organization_schema_1.OrganizationSchema },
            ]),
        ],
        controllers: [menus_controller_1.MenusController],
        providers: [menus_service_1.MenusService],
        exports: [menus_service_1.MenusService],
    })
], MenusModule);
//# sourceMappingURL=menus.module.js.map