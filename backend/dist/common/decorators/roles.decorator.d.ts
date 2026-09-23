export declare enum Role {
    SUPER_ADMIN = "super_admin",
    ORG_ADMIN = "org_admin",
    RESTAURANT_OWNER = "restaurant_owner",
    MANAGER = "manager",
    STAFF = "staff"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
