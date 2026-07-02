import { Module } from '@nestjs/common';
import { SalaryComponentsController } from './salary-components.controller';
import { SalaryComponentsService } from './salary-components.service';
import { SalaryComponentsRepository } from './salary-components.repository';

@Module({
  controllers: [SalaryComponentsController],
  providers: [SalaryComponentsService, SalaryComponentsRepository],
  exports: [SalaryComponentsService, SalaryComponentsRepository],
})
export class SalaryComponentsModule {}
