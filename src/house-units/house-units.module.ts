import { Module } from '@nestjs/common';
import { HouseUnitsController } from './house-units.controller';
import { HouseUnitsService } from './house-units.service';
import { HouseUnitsRepository } from './house-units.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HouseUnitsController],
  providers: [HouseUnitsService, HouseUnitsRepository],
  exports: [HouseUnitsService, HouseUnitsRepository],
})
export class HouseUnitsModule {}
