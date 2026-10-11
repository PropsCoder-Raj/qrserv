export declare class SelectedAddOnDto {
    name: string;
    emoji?: string;
    priceDelta?: number;
}
export declare class SelectedSpiceLevelDto {
    name: string;
    emoji?: string;
    priceDelta?: number;
}
export declare class OrderItemDto {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    itemType?: string;
    spiceLevel?: SelectedSpiceLevelDto;
    addOns?: SelectedAddOnDto[];
    specialInstructions?: string;
}
export declare class CreateOrderDto {
    restaurantId: string;
    tableId?: string | null;
    orderType?: string;
    paymentMethod?: string;
    couponCode?: string;
    items: OrderItemDto[];
    customerName?: string;
    customerPhone?: string;
}
