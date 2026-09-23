"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const withdraw_bank_detail_schema_1 = require("../../schemas/withdraw-bank-detail.schema");
const withdraw_request_schema_1 = require("../../schemas/withdraw-request.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const order_schema_1 = require("../../schemas/order.schema");
const withdraw_requests_controller_1 = require("./withdraw-requests.controller");
const withdraw_requests_service_1 = require("./withdraw-requests.service");
let WithdrawRequestsModule = class WithdrawRequestsModule {
};
exports.WithdrawRequestsModule = WithdrawRequestsModule;
exports.WithdrawRequestsModule = WithdrawRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: withdraw_bank_detail_schema_1.WithdrawBankDetail.name, schema: withdraw_bank_detail_schema_1.WithdrawBankDetailSchema },
                { name: withdraw_request_schema_1.WithdrawRequest.name, schema: withdraw_request_schema_1.WithdrawRequestSchema },
                { name: restaurant_schema_1.Restaurant.name, schema: restaurant_schema_1.RestaurantSchema },
                { name: order_schema_1.Order.name, schema: order_schema_1.OrderSchema },
            ]),
        ],
        controllers: [withdraw_requests_controller_1.WithdrawRequestsController],
        providers: [withdraw_requests_service_1.WithdrawRequestsService],
        exports: [withdraw_requests_service_1.WithdrawRequestsService],
    })
], WithdrawRequestsModule);
//# sourceMappingURL=withdraw-requests.module.js.map