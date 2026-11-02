import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderStatisticsModule } from '../../modules/order-statistics/order-statistics.module';
import { NotificationsModule } from '../../modules/notifications/notifications.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { OrderEventsListener } from './listeners/order-events.listener';

// Global module so any feature module can inject EventEmitter2 to emit events,
// and register listeners here to react to them in one common place.
@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    OrderStatisticsModule,
    WebsocketModule,
    NotificationsModule,
  ],
  providers: [OrderEventsListener],
  exports: [EventEmitterModule],
})
export class EventsModule {}
