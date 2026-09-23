import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveWithdrawRequestDto {
  @ApiPropertyOptional({ example: 'Approved after settlement review' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  approvalNote?: string;
}
