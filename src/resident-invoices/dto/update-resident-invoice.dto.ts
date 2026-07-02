import { PartialType } from '@nestjs/swagger';
import { CreateResidentInvoiceDto } from './create-resident-invoice.dto';

export class UpdateResidentInvoiceDto extends PartialType(CreateResidentInvoiceDto) {}
