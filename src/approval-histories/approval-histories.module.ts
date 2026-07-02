import { Module } from '@nestjs/common';
import { ApprovalHistoriesController } from './approval-histories.controller';
import { ApprovalHistoriesService } from './approval-histories.service';
import { ApprovalHistoriesRepository } from './approval-histories.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ApprovalHistoriesController],
  providers: [ApprovalHistoriesService, ApprovalHistoriesRepository],
  exports: [ApprovalHistoriesService, ApprovalHistoriesRepository],
})
export class ApprovalHistoriesModule {}
