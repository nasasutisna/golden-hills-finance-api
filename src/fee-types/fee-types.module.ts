import { Module } from '@nestjs/common';
import { FeeTypesController } from './fee-types.controller';
import { FeeTypesService } from './fee-types.service';
import { FeeTypesRepository } from './fee-types.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeTypesController],
  providers: [FeeTypesService, FeeTypesRepository],
  exports: [FeeTypesService, FeeTypesRepository],
})
export class FeeTypesModule {}
