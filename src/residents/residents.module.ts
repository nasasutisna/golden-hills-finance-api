import { Module } from '@nestjs/common';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';
import { ResidentsRepository } from './residents.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { HouseBlocksModule } from '../house-blocks/house-blocks.module';
import { HouseUnitsModule } from '../house-units/house-units.module';

@Module({
  imports: [PrismaModule, HouseBlocksModule, HouseUnitsModule],
  controllers: [ResidentsController],
  providers: [ResidentsService, ResidentsRepository],
  exports: [ResidentsService, ResidentsRepository],
})
export class ResidentsModule {}
