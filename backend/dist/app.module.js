"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const core_1 = require("@nestjs/core");
const configuration_1 = require("./config/configuration");
const cache_module_1 = require("./common/cache/cache.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const restaurants_module_1 = require("./modules/restaurants/restaurants.module");
const menus_module_1 = require("./modules/menus/menus.module");
const tables_module_1 = require("./modules/tables/tables.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const contact_module_1 = require("./modules/contact/contact.module");
const withdraw_requests_module_1 = require("./modules/withdraw-requests/withdraw-requests.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    uri: configService.get('mongodb.uri'),
                }),
                inject: [config_1.ConfigService],
            }),
            cache_module_1.CacheModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            restaurants_module_1.RestaurantsModule,
            menus_module_1.MenusModule,
            tables_module_1.TablesModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            subscriptions_module_1.SubscriptionsModule,
            organizations_module_1.OrganizationsModule,
            contact_module_1.ContactModule,
            withdraw_requests_module_1.WithdrawRequestsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map