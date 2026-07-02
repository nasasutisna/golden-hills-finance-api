import { PartialType } from '@nestjs/swagger';
import { CreateResidentPaymentDto } from './create-resident-payment.dto';

export class UpdateResidentPaymentDto extends PartialType(CreateResidentPaymentDto) {}
