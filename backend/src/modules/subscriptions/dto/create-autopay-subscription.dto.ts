import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateAutopaySubscriptionDto {
  @ApiProperty({ description: 'ID of the subscription plan to subscribe to' })
  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  @ApiProperty({
    description:
      'Selected duration in months for the purchase (for offers/discount calculation). Defaults to 1 if omitted.',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  months?: number;
}
