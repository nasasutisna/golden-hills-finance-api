import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryEmployeeCashAdvancesDto extends PaginationDto {
    status?: string;
    employeeId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}
