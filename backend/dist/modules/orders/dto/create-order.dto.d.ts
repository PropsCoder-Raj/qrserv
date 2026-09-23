export declare class OrderItemDto {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    itemType?: string;
}
export declare class CreateOrderDto {
    restaurantId: string;
    tableId?: string | null;
    orderType?: string;
    paymentMethod?: string;
    items: OrderItemDto[];
    customerName?: string;
    customerPhone?: string;
}
