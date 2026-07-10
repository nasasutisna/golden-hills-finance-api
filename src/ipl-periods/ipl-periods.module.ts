import { Module } from '@nestjs/common';
import { IplPeriodsService } from './ipl-periods.service';
import { IplPeriodsController } from './ipl-periods.controller';
import { IplPeriodsRepository } from './ipl-periods.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IplPeriodsController],
  providers: [IplPeriodsService, IplPeriodsRepository],
  exports: [IplPeriodsService, IplPeriodsRepository],
})
export class IplPeriodsModule {}
