import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';

export interface StaffPushPayload {
  type: 'order' | 'kitchen' | 'waiter_call';
  title: string;
  body: string;
  restaurantId: string;
  orderId?: string;
  tableId?: string;
}

// Tokens FCM reports as dead; they are removed from users so we stop sending to them.
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

const MULTICAST_BATCH_SIZE = 500;

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private messaging: Messaging | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  onModuleInit() {
    this.messaging = this.initializeMessaging();
  }

  get isEnabled(): boolean {
    return !!this.messaging;
  }

  // A browser token belongs to one user at a time (shared device after logout/login),
  // so it is detached from any other user before being attached here.
  async registerToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateMany(
      { fcmTokens: token },
      { $pull: { fcmTokens: token } },
    );
    await this.userModel.updateOne(
      { _id: userId },
      { $push: { fcmTokens: { $each: [token], $slice: -10 } } },
    );
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: token } },
    );
  }

  // Sends a data-only message so the service worker decides how to display it
  // (it stays silent when a staff tab is already open and shows the in-page alert).
  async notifyStaff(payload: StaffPushPayload): Promise<void> {
    if (!this.messaging) return;
    if (!Types.ObjectId.isValid(payload.restaurantId)) return;

    const recipients = await this.userModel
      .find({
        restaurantId: new Types.ObjectId(payload.restaurantId),
        role: { $in: [UserRole.CAPTAIN, UserRole.KITCHEN] },
        isActive: true,
        notificationsEnabled: true,
      })
      .select('+fcmTokens')
      .lean();

    const tokens = [
      ...new Set(recipients.flatMap((user) => user.fcmTokens || [])),
    ];
    if (tokens.length === 0) return;

    const data: Record<string, string> = {
      type: payload.type,
      title: payload.title,
      body: payload.body,
      restaurantId: payload.restaurantId,
      ...(payload.orderId ? { orderId: payload.orderId } : {}),
      ...(payload.tableId ? { tableId: payload.tableId } : {}),
    };

    for (let i = 0; i < tokens.length; i += MULTICAST_BATCH_SIZE) {
      const batch = tokens.slice(i, i + MULTICAST_BATCH_SIZE);
      try {
        const response = await this.messaging.sendEachForMulticast({
          tokens: batch,
          data,
          webpush: {
            headers: { Urgency: 'high' },
            fcmOptions: { link: '/staff/orders' },
          },
        });

        const invalid: string[] = [];
        response.responses.forEach((res, idx) => {
          if (!res.success && INVALID_TOKEN_CODES.has(res.error?.code ?? '')) {
            invalid.push(batch[idx]);
          }
        });
        if (invalid.length) {
          await this.userModel.updateMany(
            { fcmTokens: { $in: invalid } },
            { $pull: { fcmTokens: { $in: invalid } } },
          );
        }
      } catch (err: any) {
        this.logger.error(`FCM multicast failed: ${err?.message}`, err?.stack);
      }
    }
  }

  private initializeMessaging(): Messaging | null {
    const inlineJson = this.configService.get<string>('firebase.serviceAccountJson');
    const filePath = this.configService.get<string>('firebase.serviceAccountPath');

    let credentials: ServiceAccount | null = null;
    try {
      if (inlineJson) {
        credentials = JSON.parse(inlineJson);
      } else if (filePath) {
        credentials = JSON.parse(readFileSync(resolve(filePath), 'utf8'));
      }
    } catch (err: any) {
      this.logger.error(`Invalid Firebase service account: ${err?.message}`);
      return null;
    }

    if (!credentials) {
      this.logger.warn(
        'FCM disabled: set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON to enable push notifications',
      );
      return null;
    }

    const app = getApps().length
      ? getApp()
      : initializeApp({ credential: cert(credentials) });
    return getMessaging(app);
  }
}
