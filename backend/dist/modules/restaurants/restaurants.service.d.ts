import { Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../../schemas/restaurant.schema';
import { OrganizationDocument } from '../../schemas/organization.schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class RestaurantsService {
    private restaurantModel;
    private organizationModel;
    private readonly organizationPopulate;
    constructor(restaurantModel: Model<RestaurantDocument>, organizationModel: Model<OrganizationDocument>);
    validateOrgRestaurant(restaurantId: string, organizationId: string): Promise<void>;
    validateOwnerRestaurant(restaurantId: string, userRestaurantId: string): Promise<void>;
    private generateSlug;
    create(createRestaurantDto: CreateRestaurantDto, ownerId: string): Promise<import("mongoose").Document<unknown, {}, RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & Restaurant & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(query?: PaginationQueryDto, organizationId?: string): Promise<{
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
    findByRestaurantId(restaurantId: string): Promise<{
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
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & Restaurant & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findBySlug(slug: string): Promise<import("mongoose").Document<unknown, {}, RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & Restaurant & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    private getOrganizationSubscriptionState;
    getPublicInfo(id: string): Promise<{
        hasMenuPdf: boolean;
        canShowMenuPdf: boolean;
        subscriptionExpiry: any;
        hasSubscriptionPlan: boolean;
        hasActivePlan: boolean;
        isPlanExpired: boolean;
        isPaymentGatewayAllocated: boolean;
        isMenuPdfEnabled: boolean;
        organizationIsActive?: undefined;
        restaurantIsActive: boolean;
        menuPdf: string;
        name: string;
        slug: string;
        owner_name: string;
        restaurant_type: import("../../schemas/restaurant.schema").RestaurantType;
        description: string;
        logo: string;
        address: string;
        phone: string;
        email: string;
        gst_no: string;
        vat_no: string;
        taxEnabled: boolean;
        taxRate: number;
        taxType: import("../../schemas/restaurant.schema").TaxType;
        vatEnabled: boolean;
        vatRate: number;
        vatType: import("../../schemas/restaurant.schema").TaxType;
        ownerId: Types.ObjectId;
        organizationId: Types.ObjectId;
        isActive: boolean;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    } | {
        hasMenuPdf: boolean;
        canShowMenuPdf: boolean;
        organizationIsActive: boolean;
        subscriptionExpiry: Date;
        hasSubscriptionPlan: boolean;
        hasActivePlan: boolean;
        isPlanExpired: boolean;
        isPaymentGatewayAllocated: boolean;
        isMenuPdfEnabled: boolean;
        restaurantIsActive: boolean;
        menuPdf: string;
        name: string;
        slug: string;
        owner_name: string;
        restaurant_type: import("../../schemas/restaurant.schema").RestaurantType;
        description: string;
        logo: string;
        address: string;
        phone: string;
        email: string;
        gst_no: string;
        vat_no: string;
        taxEnabled: boolean;
        taxRate: number;
        taxType: import("../../schemas/restaurant.schema").TaxType;
        vatEnabled: boolean;
        vatRate: number;
        vatType: import("../../schemas/restaurant.schema").TaxType;
        ownerId: Types.ObjectId;
        organizationId: Types.ObjectId;
        isActive: boolean;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    findByOwner(ownerId: string, query?: PaginationQueryDto, organizationId?: string): Promise<{
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
    update(id: string, updateRestaurantDto: UpdateRestaurantDto): Promise<import("mongoose").Document<unknown, {}, RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & Restaurant & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    uploadMenuPdf(restaurantId: string, file: any): Promise<{
        message: string;
        menuPdf: string;
    }>;
}
