import { PartialType } from '@nestjs/swagger';
import { CreateSecurityScheduleDto } from './create-security-schedule.dto';

export class UpdateSecurityScheduleDto extends PartialType(CreateSecurityScheduleDto) {}
