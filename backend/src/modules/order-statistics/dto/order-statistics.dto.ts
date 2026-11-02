import { ApiProperty } from '@nestjs/swagger';

export class OrderStatisticsDto {
  @ApiProperty()
  orgId: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  pendingOrderCount: number;

  @ApiProperty()
  confirmedOrderCount: number;

  @ApiProperty()
  readyOrderCount: number;

  @ApiProperty()
  completedOrderCount: number;

  @ApiProperty()
  cancelledOrderCount: number;

  @ApiProperty()
  totalOrderAmount: number;
}
