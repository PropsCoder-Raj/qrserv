import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PasscodeLoginDto {
  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  @IsString()
  passcode: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  restaurantId: string;
}
