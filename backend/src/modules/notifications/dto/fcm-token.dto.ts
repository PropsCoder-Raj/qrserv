import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FcmTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token: string;
}
