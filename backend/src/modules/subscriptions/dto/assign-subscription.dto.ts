import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  subscriptionId: string;
}
