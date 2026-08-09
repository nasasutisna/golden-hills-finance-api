import { Module } from '@nestjs/common';
import { SecuritySchedulesController } from './security-schedules.controller';
import { SecuritySchedulesService } from './security-schedules.service';
import { SecuritySchedulesRepository } from './security-schedules.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecuritySchedulesController],
  providers: [SecuritySchedulesService, SecuritySchedulesRepository],
  exports: [SecuritySchedulesService, SecuritySchedulesRepository],
})
export class SecuritySchedulesModule {}
