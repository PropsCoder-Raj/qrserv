import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Organization, OrganizationDocument } from '../../schemas/organization.schema';
import { Restaurant, RestaurantDocument } from '../../schemas/restaurant.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class OrganizationsService {
    private organizationModel;
    private restaurantModel;
    private orderModel;
    private configService;
    private razorpay;
    constructor(organizationModel: Model<OrganizationDocument>, restaurantModel: Model<RestaurantDocument>, orderModel: Model<OrderDocument>, configService: ConfigService);
    private generateSlug;
    create(dto: CreateOrganizationDto): Promise<import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(query?: PaginationQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    }>;
    findById(id: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findByOwner(ownerId: string): Promise<import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, dto: UpdateOrganizationDto): Promise<import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    findRestaurants(orgId: string, query?: PaginationQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & Restaurant & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    }>;
    getOrderSummary(orgId: string, restaurantId?: string): Promise<{
        organization: import("mongoose").Document<unknown, {}, OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & Organization & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        summary: {
            totalOrders: number;
            totalRazorpayOrders: number;
            totalRazorpayAmount: number;
        };
    }>;
    getRazorpayOrderHistory(orgId: string, query?: PaginationQueryDto): Promise<{
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
    }>;
    getRazorpayPaymentDetails(orgId: string, paymentId: string): Promise<{
        order: Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
        paymentDetails: any;
        razorpayOrderDetails: any;
    }>;
    private getScopedRestaurantIds;
}
