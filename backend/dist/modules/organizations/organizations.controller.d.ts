import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(dto: CreateOrganizationDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Organization & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(query?: PaginationQueryDto, role?: string, organizationId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas").OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Organization & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    }>;
    findMyOrganization(organizationId: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Organization & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getOrderSummary(id: string, restaurantId?: string, role?: string, organizationId?: string): Promise<{
        organization: import("mongoose").Document<unknown, {}, import("../../schemas").OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Organization & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
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
    getRazorpayOrderHistory(id: string, query?: PaginationQueryDto, restaurantId?: string, role?: string, organizationId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    }>;
    getRazorpayPaymentDetails(id: string, paymentId: string, role?: string, organizationId?: string): Promise<{
        order: import("../../schemas").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        paymentDetails: any;
        razorpayOrderDetails: any;
    }>;
    findOne(id: string, role?: string, organizationId?: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Organization & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, dto: UpdateOrganizationDto, role?: string, organizationId?: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").OrganizationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Organization & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    findRestaurants(id: string, query?: PaginationQueryDto, role?: string, organizationId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas").RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Restaurant & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    }>;
}
