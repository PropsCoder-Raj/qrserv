import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'My Restaurant Group' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A group of fine dining restaurants' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: '123 Corporate Blvd' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @ValidateIf((o) => o.phone !== '' && o.phone != null)
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone must be a 10-digit number starting with 6, 7, 8 or 9',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'info@orggroup.com' })
  @IsOptional()
  @ValidateIf((o) => o.email !== '' && o.email != null)
  @IsEmail({}, { message: 'Enter a valid email address' })
  email?: string;

  @ApiProperty({ description: 'User ID of the org admin/owner' })
  @IsNotEmpty()
  @IsString()
  ownerId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
