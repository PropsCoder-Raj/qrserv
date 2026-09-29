import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Manager/staff clients join a room per restaurant so new-order
// notifications can be pushed to only the relevant staff panel.
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server: Server;

  private restaurantRoom(restaurantId: string) {
    return `restaurant:${restaurantId}`;
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId?: string },
  ) {
    if (!data?.restaurantId) return;
    client.join(this.restaurantRoom(data.restaurantId));
  }

  emitNewOrder(restaurantId: string, payload: Record<string, unknown>) {
    if (!restaurantId) return;
    this.logger.log(`Emitting order:new to restaurant ${restaurantId}`);
    this.server?.to(this.restaurantRoom(restaurantId)).emit('order:new', payload);
  }
}
