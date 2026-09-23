import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'password123' })
  @ValidateIf((o) => o.role !== UserRole.MANAGER && o.role !== UserRole.STAFF)
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: '1234' })
  @ValidateIf((o) => o.role === UserRole.MANAGER || o.role === UserRole.STAFF)
  @IsNotEmpty()
  @IsString()
  @Length(4, 6)
  passcode?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone must be a 10-digit number starting with 6, 7, 8 or 9',
  })
  phone?: string;

  @ApiProperty({ enum: UserRole })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
