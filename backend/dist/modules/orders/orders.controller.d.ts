import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { CancelOrderItemDto } from './dto/cancel-order-item.dto';
import { RollbackFailedOrderDto } from './dto/rollback-failed-order.dto';
import { UpdateCustomerOrderItemsDto } from './dto/update-customer-order-items.dto';
import { OrderStatus } from '../../schemas/order.schema';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(dto: CreateOrderDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    createForCustomerApp(dto: CreateOrderDto): Promise<{
        order: import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        paymentRequired: boolean;
        payment?: undefined;
    } | {
        order: import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        paymentRequired: boolean;
        payment: {
            paymentId: import("mongoose").Types.ObjectId;
            razorpayOrderId: any;
            amount: any;
            currency: any;
            keyId: string;
        };
    }>;
    rollbackFailedCustomerOrder(dto: RollbackFailedOrderDto): Promise<{
        message: string;
    }>;
    updateCustomerTableOrderItems(id: string, dto: UpdateCustomerOrderItemsDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(restaurantId?: string, status?: OrderStatus, query?: PaginationQueryDto, role?: string, organizationId?: string, userRestaurantId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        summary: {
            totalOrders: any;
            totalAmount: any;
        };
    }>;
    getStats(restaurantId?: string, query?: PaginationQueryDto, user?: any, role?: string, organizationId?: string, userRestaurantId?: string): Promise<{
        totalOrders: any;
        totalSales: any;
        mostSoldItems: {
            name: any;
            quantity: any;
        }[];
        revenueDaily: {
            label: any;
            revenue: any;
            orders: any;
        }[];
        revenueWeekly: {
            label: any;
            revenue: any;
            orders: any;
        }[];
        revenueMonthly: {
            label: any;
            revenue: any;
            orders: any;
        }[];
        revenueYearly: {
            label: any;
            revenue: any;
            orders: any;
        }[];
    }>;
    findByPhone(phone: string): Promise<(import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getStatus(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    cancelOrderItem(id: string, dto: CancelOrderItemDto, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
