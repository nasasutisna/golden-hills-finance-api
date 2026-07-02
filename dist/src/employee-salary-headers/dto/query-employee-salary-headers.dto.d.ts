import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryEmployeeSalaryHeadersDto extends PaginationDto {
    status?: string;
    employeeId?: string;
    payPeriod?: string;
    paymentDateFrom?: string;
    paymentDateTo?: string;
    search?: string;
    locked?: boolean;
}
