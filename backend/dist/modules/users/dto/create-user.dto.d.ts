import { UserRole } from '../../../schemas/user.schema';
export declare class CreateUserDto {
    name: string;
    email: string;
    password?: string;
    passcode?: string;
    phone?: string;
    role: UserRole;
    restaurantId?: string;
    organizationId?: string;
}
