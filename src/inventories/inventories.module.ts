import { Module } from '@nestjs/common';
import { InventoriesController } from './inventories.controller';
import { InventoriesService } from './inventories.service';
import { InventoriesRepository } from './inventories.repository';

@Module({
  controllers: [InventoriesController],
  providers: [InventoriesService, InventoriesRepository],
  exports: [InventoriesService, InventoriesRepository],
})
export class InventoriesModule {}
