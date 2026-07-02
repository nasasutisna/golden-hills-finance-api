import { Module } from '@nestjs/common';
import { EmployeePositionsController } from './employee-positions.controller';
import { EmployeePositionsService } from './employee-positions.service';
import { EmployeePositionsRepository } from './employee-positions.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeePositionsController],
  providers: [EmployeePositionsService, EmployeePositionsRepository],
  exports: [EmployeePositionsService, EmployeePositionsRepository],
})
export class EmployeePositionsModule {}
