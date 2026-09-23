declare class SubscriptionOfferDto {
    months: number;
    offerPercent: number;
}
export declare class CreateSubscriptionDto {
    name: string;
    price: number;
    discountType?: 'none' | 'flat' | 'percentage';
    discountValue?: number;
    isPaymentGatewayAllocated?: boolean;
    isMenuPdfEnabled?: boolean;
    duration: number;
    maxTables?: number;
    maxMenuItems?: number;
    maxCategories?: number;
    maxRestaurants?: number;
    customerDataAccess?: string;
    features?: string[];
    offers?: SubscriptionOfferDto[];
}
export {};
