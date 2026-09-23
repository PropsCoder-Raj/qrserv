import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CancelOrderItemDto {
  @ApiProperty({
    description: 'Index of item in Order.items array',
    example: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  itemIndex: number;

  @ApiProperty({ description: 'Quantity to cancel', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cancelQuantity: number;

  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Out of stock',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
