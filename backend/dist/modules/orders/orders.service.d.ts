import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../../schemas/order.schema';
import { RestaurantDocument } from '../../schemas/restaurant.schema';
import { OrganizationDocument } from '../../schemas/organization.schema';
import { SubscriptionDocument } from '../../schemas/subscription.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { CancelOrderItemDto } from './dto/cancel-order-item.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaymentsService } from '../payments/payments.service';
import { PaymentDocument } from '../../schemas/payment.schema';
import { TableDocument } from '../../schemas/table.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatisticsService } from '../order-statistics/order-statistics.service';
import { CouponsService } from '../coupons/coupons.service';
export declare class OrdersService {
    private orderModel;
    private restaurantModel;
    private organizationModel;
    private subscriptionModel;
    private paymentModel;
    private tableModel;
    private paymentsService;
    private eventEmitter;
    private orderStatisticsService;
    private couponsService;
    private readonly orderRelationPopulate;
    constructor(orderModel: Model<OrderDocument>, restaurantModel: Model<RestaurantDocument>, organizationModel: Model<OrganizationDocument>, subscriptionModel: Model<SubscriptionDocument>, paymentModel: Model<PaymentDocument>, tableModel: Model<TableDocument>, paymentsService: PaymentsService, eventEmitter: EventEmitter2, orderStatisticsService: OrderStatisticsService, couponsService: CouponsService);
    private toObjectId;
    validateOrgRestaurant(restaurantId: string | Types.ObjectId, organizationId: string | Types.ObjectId): Promise<void>;
    private generateOrderNumber;
    private isPaymentGatewayAllocatedForRestaurant;
    create(dto: CreateOrderDto): Promise<OrderDocument>;
    createForCustomerApp(dto: CreateOrderDto): Promise<{
        order: OrderDocument;
        paymentRequired: boolean;
        payment?: undefined;
    } | {
        order: OrderDocument | (import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        });
        paymentRequired: boolean;
        payment: {
            paymentId: Types.ObjectId;
            razorpayOrderId: any;
            amount: any;
            currency: any;
            keyId: string;
        };
    }>;
    rollbackFailedCustomerOrder(orderId: string, razorpayOrderId: string): Promise<{
        message: string;
    }>;
    updateCustomerTableOrderItems(id: string, items: OrderItemDto[]): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateOrderItems(id: string, dto: UpdateOrderItemsDto, role: string, organizationId?: string, userRestaurantId?: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    private calculateManualDiscount;
    private computeTotalsForItems;
    private resolveItemTaxRates;
    cancelOrderItem(id: string, dto: CancelOrderItemDto, userId: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(restaurantId?: string, status?: OrderStatus, query?: PaginationQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
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
    findAllByOrganization(organizationId: string, status?: OrderStatus, query?: PaginationQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
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
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getInvoice(id: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getStatus(id: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updatePaymentMethod(id: string, dto: UpdatePaymentMethodDto): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findByRestaurant(restaurantId: string): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    findByPhone(phone: string): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getStats(restaurantId?: string | Types.ObjectId, dateQuery?: Pick<PaginationQueryDto, 'datePreset' | 'fromDate' | 'toDate'>): Promise<{
        totalOrders: any;
        totalSales: any;
        averageOrderValue: number;
        totalCompletedOrders: number;
        totalCompletedSales: number;
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
    getStatsByAll(dateQuery?: Pick<PaginationQueryDto, 'datePreset' | 'fromDate' | 'toDate'>): Promise<{
        totalOrders: any;
        totalSales: any;
        averageOrderValue: number;
        totalCompletedOrders: number;
        totalCompletedSales: number;
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
    getStatsByOrganization(organizationId: string | Types.ObjectId, dateQuery?: Pick<PaginationQueryDto, 'datePreset' | 'fromDate' | 'toDate'>): Promise<{
        totalOrders: any;
        totalSales: any;
        averageOrderValue: number;
        totalCompletedOrders: number;
        totalCompletedSales: number;
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
    private getStatsWithMatch;
    remove(id: string, role: string, organizationId?: string, userRestaurantId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
