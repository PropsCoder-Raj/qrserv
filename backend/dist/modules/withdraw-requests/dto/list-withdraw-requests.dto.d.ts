import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { WithdrawRequestStatus } from '../../../schemas/withdraw-request.schema';
export declare class ListWithdrawRequestsDto extends PaginationQueryDto {
    status?: WithdrawRequestStatus;
    organizationId?: string;
}
