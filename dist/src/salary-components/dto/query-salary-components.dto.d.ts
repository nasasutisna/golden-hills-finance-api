import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QuerySalaryComponentsDto extends PaginationDto {
    componentType?: string;
    calculationType?: string;
    isActive?: boolean;
    isTaxSubject?: boolean;
    search?: string;
}
