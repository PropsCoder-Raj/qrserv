import { IsMongoId } from 'class-validator';

export class CallWaiterDto {
  @IsMongoId()
  restaurantId: string;

  @IsMongoId()
  tableId: string;
}
