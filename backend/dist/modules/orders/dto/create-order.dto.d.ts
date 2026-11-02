import { ManualDiscountType, PaymentMethod, PaymentStatus } from '../../../schemas/order.schema';
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
    cookingNote?: string;
    instruction?: string;
    notes?: string;
}
export declare class CreateOrderDto {
    restaurantId: string;
    tableId?: string | null;
    orderType?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    couponCode?: string;
    manualDiscountType?: ManualDiscountType | string | null;
    manualDiscountValue?: number;
    manualDiscountReason?: string;
    manual_discount_type?: ManualDiscountType | string | null;
    manual_discount_value?: number;
    manual_discount_reason?: string;
    items: OrderItemDto[];
    customerName?: string;
    customerPhone?: string;
    order_instructions?: string;
    orderInstructions?: string;
    orderNotes?: string;
}
