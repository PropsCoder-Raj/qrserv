import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import {
  Subscription,
  SubscriptionSchema,
} from '../../schemas/subscription.schema';
import {
  Organization,
  OrganizationSchema,
} from '../../schemas/organization.schema';
import {
  SubscriptionHistory,
  SubscriptionHistorySchema,
} from '../../schemas/subscription-history.schema';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: SubscriptionHistory.name, schema: SubscriptionHistorySchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, ApiKeyGuard],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
