import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CallWaiterDto } from './dto/call-waiter.dto';
import { WaiterCallsService } from './waiter-calls.service';

@ApiTags('Waiter Calls')
@Controller('api/waiter-calls')
export class WaiterCallsController {
  constructor(private readonly waiterCallsService: WaiterCallsService) {}

  // Public because guests scan a table QR code and are not logged in.
  @Public()
  @Post()
  @ApiOperation({ summary: 'Guest requests a waiter for their table' })
  callWaiter(@Body() dto: CallWaiterDto) {
    return this.waiterCallsService.callWaiter(dto.restaurantId, dto.tableId);
  }
}
