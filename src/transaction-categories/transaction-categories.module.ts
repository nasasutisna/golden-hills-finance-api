import { Module } from '@nestjs/common';
import { TransactionCategoriesController } from './transaction-categories.controller';
import { TransactionCategoriesService } from './transaction-categories.service';
import { TransactionCategoriesRepository } from './transaction-categories.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TransactionCategoriesController],
  providers: [TransactionCategoriesService, TransactionCategoriesRepository],
  exports: [TransactionCategoriesService, TransactionCategoriesRepository],
})
export class TransactionCategoriesModule {}
