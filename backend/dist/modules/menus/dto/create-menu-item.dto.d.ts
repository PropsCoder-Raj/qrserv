import { ItemType } from '../../../schemas/menu-item.schema';
export declare class CreateMenuItemDto {
    name: string;
    description?: string;
    price: number;
    image?: string;
    categoryId: string;
    restaurantId: string;
    isVeg?: boolean;
    preparationTime?: number;
    itemType?: ItemType;
}
