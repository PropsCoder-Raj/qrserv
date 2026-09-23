"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
const user_schema_1 = require("../../schemas/user.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const date_range_1 = require("../../common/utils/date-range");
const isStaffRole = (role) => role === user_schema_1.UserRole.MANAGER || role === user_schema_1.UserRole.STAFF;
let UsersService = UsersService_1 = class UsersService {
    constructor(userModel, restaurantModel) {
        this.userModel = userModel;
        this.restaurantModel = restaurantModel;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    toObjectId(value, fieldName) {
        if (!value) {
            throw new common_1.BadRequestException(`Invalid ${fieldName}`);
        }
        if (value instanceof mongoose_2.Types.ObjectId) {
            return value;
        }
        const valueString = value.toString();
        if (!mongoose_2.Types.ObjectId.isValid(valueString)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName}`);
        }
        return new mongoose_2.Types.ObjectId(valueString);
    }
    normalizeOptionalId(value, fieldName) {
        if (value === null || value === undefined) {
            return null;
        }
        const normalized = typeof value === 'string' ? value.trim() : value.toString().trim();
        if (!normalized) {
            return null;
        }
        if (!mongoose_2.Types.ObjectId.isValid(normalized)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName}`);
        }
        return normalized;
    }
    async validateOrgRestaurant(restaurantId, organizationId) {
        const restaurantObjectId = this.toObjectId(restaurantId, 'restaurantId');
        const organizationObjectId = this.toObjectId(organizationId, 'organizationId');
        const restaurant = await this.restaurantModel
            .findById(restaurantObjectId)
            .select('organizationId');
        if (!restaurant ||
            !restaurant.organizationId?.equals(organizationObjectId)) {
            throw new common_1.ForbiddenException('Restaurant does not belong to your organization');
        }
    }
    async validateOrgUser(userId, organizationId) {
        const userObjectId = this.toObjectId(userId, 'userId');
        const organizationObjectId = this.toObjectId(organizationId, 'organizationId');
        const targetUser = await this.userModel
            .findById(userObjectId)
            .select('organizationId restaurantId');
        if (!targetUser)
            throw new common_1.NotFoundException('User not found');
        if (targetUser.organizationId?.equals(organizationObjectId))
            return;
        if (targetUser.restaurantId) {
            const restaurant = await this.restaurantModel
                .findById(targetUser.restaurantId)
                .select('organizationId');
            if (restaurant &&
                restaurant.organizationId?.equals(organizationObjectId))
                return;
        }
        throw new common_1.ForbiddenException('User does not belong to your organization');
    }
    async onModuleInit() {
        await this.createSuperAdmin();
    }
    async createSuperAdmin() {
        const email = 'admin@admin.com';
        const existing = await this.userModel.findOne({ email });
        if (existing)
            return;
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.userModel.create({
            name: 'Super Admin',
            email,
            password: hashedPassword,
            role: user_schema_1.UserRole.SUPER_ADMIN,
            isActive: true,
        });
        this.logger.log('Default super admin created (admin@admin.com / admin123)');
    }
    async create(createUserDto) {
        const existing = await this.userModel.findOne({
            email: createUserDto.email,
        });
        if (existing) {
            throw new common_1.ConflictException('Email already exists');
        }
        const userData = { ...createUserDto };
        const organizationId = this.normalizeOptionalId(createUserDto.organizationId, 'organizationId');
        const restaurantId = this.normalizeOptionalId(createUserDto.restaurantId, 'restaurantId');
        userData.organizationId = organizationId
            ? new mongoose_2.Types.ObjectId(organizationId)
            : null;
        userData.restaurantId = restaurantId
            ? new mongoose_2.Types.ObjectId(restaurantId)
            : null;
        if (isStaffRole(createUserDto.role)) {
            if (createUserDto.passcode && restaurantId) {
                await this.validatePasscodeUnique(createUserDto.passcode, restaurantId);
            }
            userData.passcode = await bcrypt.hash(createUserDto.passcode, 10);
            delete userData.password;
        }
        else {
            userData.password = await bcrypt.hash(createUserDto.password, 10);
            delete userData.passcode;
        }
        const user = await this.userModel.create(userData);
        const { password, passcode, refreshToken, ...result } = user.toObject();
        return result;
    }
    async findAll(restaurantId, query, organizationId) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', } = query || {};
        const filter = {};
        const andConditions = [];
        if (organizationId) {
            const orgRestaurants = await this.restaurantModel
                .find({ organizationId })
                .select('_id')
                .exec();
            const restaurantIds = orgRestaurants.map((r) => r._id);
            filter.role = { $ne: user_schema_1.UserRole.SUPER_ADMIN };
            andConditions.push({
                $or: [{ organizationId }, { restaurantId: { $in: restaurantIds } }],
            });
        }
        else if (restaurantId) {
            filter.restaurantId = restaurantId;
        }
        if (search) {
            andConditions.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                ],
            });
        }
        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }
        const range = (0, date_range_1.getDateRangeFromPreset)(query?.datePreset);
        if (range) {
            filter.createdAt = { $gte: range.from, $lte: range.to };
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
            sort.createdAt = -1;
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.userModel
                .find(filter)
                .select('-password -passcode -refreshToken')
                .populate('organizationId')
                .populate('restaurantId')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.userModel.countDocuments(filter).exec(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const user = await this.userModel
            .findById(id)
            .select('-password -passcode -refreshToken');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async update(id, updateUserDto) {
        const updateData = { ...updateUserDto };
        const hasOrganizationId = Object.prototype.hasOwnProperty.call(updateUserDto, 'organizationId');
        const hasRestaurantId = Object.prototype.hasOwnProperty.call(updateUserDto, 'restaurantId');
        if (hasOrganizationId) {
            const organizationId = this.normalizeOptionalId(updateUserDto.organizationId, 'organizationId');
            updateData.organizationId = organizationId
                ? new mongoose_2.Types.ObjectId(organizationId)
                : null;
        }
        if (hasRestaurantId) {
            const restaurantId = this.normalizeOptionalId(updateUserDto.restaurantId, 'restaurantId');
            updateData.restaurantId = restaurantId
                ? new mongoose_2.Types.ObjectId(restaurantId)
                : null;
        }
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        if (updateData.passcode) {
            const existingUser = await this.userModel.findById(id);
            if (existingUser && isStaffRole(existingUser.role)) {
                const restaurantId = updateData.restaurantId?.toString() ||
                    existingUser.restaurantId?.toString();
                if (restaurantId) {
                    await this.validatePasscodeUnique(updateData.passcode, restaurantId, id);
                }
            }
            updateData.passcode = await bcrypt.hash(updateData.passcode, 10);
        }
        const user = await this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .select('-password -passcode -refreshToken');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async validatePasscodeUnique(passcode, restaurantId, excludeUserId) {
        const query = {
            restaurantId,
            role: { $in: [user_schema_1.UserRole.MANAGER, user_schema_1.UserRole.STAFF] },
            passcode: { $exists: true, $ne: null },
        };
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }
        const usersInRestaurant = await this.userModel.find(query);
        for (const user of usersInRestaurant) {
            const isMatch = await bcrypt.compare(passcode, user.passcode);
            if (isMatch) {
                throw new common_1.ConflictException('This passcode is already used by another user in this restaurant');
            }
        }
    }
    async remove(id) {
        const user = await this.userModel.findByIdAndDelete(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return { message: 'User deleted successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(restaurant_schema_1.Restaurant.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map