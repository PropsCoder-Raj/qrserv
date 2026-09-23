import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { WithdrawRequestStatus } from '../../../schemas/withdraw-request.schema';

export class ListWithdrawRequestsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: WithdrawRequestStatus })
  @IsOptional()
  @IsIn(Object.values(WithdrawRequestStatus))
  status?: WithdrawRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
