"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = exports.Role = void 0;
const common_1 = require("@nestjs/common");
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["ORG_ADMIN"] = "org_admin";
    Role["RESTAURANT_OWNER"] = "restaurant_owner";
    Role["MANAGER"] = "manager";
    Role["STAFF"] = "staff";
})(Role || (exports.Role = Role = {}));
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
//# sourceMappingURL=roles.decorator.js.map