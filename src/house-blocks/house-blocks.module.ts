import { Module } from '@nestjs/common';
import { HouseBlocksController } from './house-blocks.controller';
import { HouseBlocksService } from './house-blocks.service';
import { HouseBlocksRepository } from './house-blocks.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HouseBlocksController],
  providers: [HouseBlocksService, HouseBlocksRepository],
  exports: [HouseBlocksService, HouseBlocksRepository],
})
export class HouseBlocksModule {}
