import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { CacheService } from '../../common/cache/cache.service';
import { OrderEvent, WaiterCalledEvent } from '../../common/events/order-events';
import { Table, TableDocument } from '../../schemas/table.schema';

// Stops a guest from spamming the waiter button; the UI shows the same window.
export const WAITER_CALL_COOLDOWN_SECONDS = 60;

@Injectable()
export class WaiterCallsService {
  constructor(
    @InjectModel(Table.name) private readonly tableModel: Model<TableDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
  ) {}

  async callWaiter(restaurantId: string, tableId: string) {
    const table = await this.tableModel
      .findOne({ _id: tableId, restaurantId, isActive: true })
      .select('tableNumber')
      .lean();
    if (!table) throw new NotFoundException('Table not found');

    const cooldownKey = `waiter-call:${tableId}`;
    if (this.cacheService.get(cooldownKey)) {
      throw new HttpException(
        'A waiter has already been called for this table. Please wait a moment.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.cacheService.set(cooldownKey, true, WAITER_CALL_COOLDOWN_SECONDS);

    this.eventEmitter.emit(
      OrderEvent.WAITER_CALLED,
      new WaiterCalledEvent(restaurantId, tableId, table.tableNumber),
    );

    return { success: true, cooldownSeconds: WAITER_CALL_COOLDOWN_SECONDS };
  }
}
