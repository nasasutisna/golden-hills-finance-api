import { Module } from '@nestjs/common';
import { InventoryRequestsController } from './inventory-requests.controller';
import { InventoryRequestsService } from './inventory-requests.service';
import { InventoryRequestsRepository } from './inventory-requests.repository';

@Module({
  controllers: [InventoryRequestsController],
  providers: [InventoryRequestsService, InventoryRequestsRepository],
  exports: [InventoryRequestsService, InventoryRequestsRepository],
})
export class InventoryRequestsModule {}
