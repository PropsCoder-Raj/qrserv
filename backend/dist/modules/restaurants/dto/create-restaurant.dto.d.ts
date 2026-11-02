import { RestaurantType, TaxType } from '../../../schemas/restaurant.schema';
export declare class CreateRestaurantDto {
    organizationId: string;
    name: string;
    owner_name: string;
    restaurant_type: RestaurantType;
    description?: string;
    logo?: string;
    address: string;
    phone?: string;
    email?: string;
    gst_no?: string;
    vat_no?: string;
    cr_number?: string;
    receipt_header_note?: string;
    taxEnabled?: boolean;
    taxRate?: number;
    taxType?: TaxType;
    vatEnabled?: boolean;
    vatRate?: number;
    vatType?: TaxType;
    isActive?: boolean;
}
