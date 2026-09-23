import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class RestaurantsController {
    private readonly restaurantsService;
    constructor(restaurantsService: RestaurantsService);
    create(createRestaurantDto: CreateRestaurantDto, userId: string, role?: string, organizationId?: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Restaurant & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(query?: PaginationQueryDto, role?: string, organizationId?: string): Promise<{
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
    findMyRestaurants(userId: string, organizationId?: string, userRestaurantId?: string, role?: string, query?: PaginationQueryDto): Promise<{
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
    findBySlug(slug: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Restaurant & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
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
        restaurant_type: import("../../schemas").RestaurantType;
        description: string;
        logo: string;
        address: string;
        phone: string;
        email: string;
        gst_no: string;
        vat_no: string;
        taxEnabled: boolean;
        taxRate: number;
        taxType: import("../../schemas").TaxType;
        vatEnabled: boolean;
        vatRate: number;
        vatType: import("../../schemas").TaxType;
        ownerId: import("mongoose").Types.ObjectId;
        organizationId: import("mongoose").Types.ObjectId;
        isActive: boolean;
        _id: import("mongoose").Types.ObjectId;
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
        restaurant_type: import("../../schemas").RestaurantType;
        description: string;
        logo: string;
        address: string;
        phone: string;
        email: string;
        gst_no: string;
        vat_no: string;
        taxEnabled: boolean;
        taxRate: number;
        taxType: import("../../schemas").TaxType;
        vatEnabled: boolean;
        vatRate: number;
        vatType: import("../../schemas").TaxType;
        ownerId: import("mongoose").Types.ObjectId;
        organizationId: import("mongoose").Types.ObjectId;
        isActive: boolean;
        _id: import("mongoose").Types.ObjectId;
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
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Restaurant & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, updateRestaurantDto: UpdateRestaurantDto, role?: string, organizationId?: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").RestaurantDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Restaurant & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    uploadMenuPdf(id: string, file: any, role?: string, organizationId?: string): Promise<{
        message: string;
        menuPdf: string;
    }>;
}
