import { ItemType } from '../../../schemas/menu-item.schema';
export declare class CustomizationOptionDto {
    name: string;
    emoji?: string;
    priceDelta?: number;
}
export declare class MenuItemCustomizationDto {
    spiceLevels?: CustomizationOptionDto[];
    addOns?: CustomizationOptionDto[];
    allowSpecialInstructions?: boolean;
}
export declare class CreateMenuItemDto {
    name: string;
    description?: string;
    ingredients?: string;
    price: number;
    image?: string;
    categoryId: string;
    restaurantId: string;
    isVeg?: boolean;
    preparationTime?: number;
    itemType?: ItemType;
    customization?: MenuItemCustomizationDto;
}
