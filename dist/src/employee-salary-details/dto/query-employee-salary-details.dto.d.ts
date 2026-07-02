import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryEmployeeSalaryDetailsDto extends PaginationDto {
    salaryHeaderId?: string;
    salaryComponentId?: string;
    manualOverride?: boolean;
}
