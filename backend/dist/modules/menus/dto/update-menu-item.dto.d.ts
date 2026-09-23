import { CreateMenuItemDto } from './create-menu-item.dto';
declare const UpdateMenuItemDto_base: import("@nestjs/common").Type<Partial<Omit<CreateMenuItemDto, "restaurantId" | "categoryId">>>;
export declare class UpdateMenuItemDto extends UpdateMenuItemDto_base {
    isAvailable?: boolean;
}
export {};
