import { Module } from '@nestjs/common';
import { CommunityEventsController } from './community-events.controller';
import { CommunityEventsService } from './community-events.service';
import { CommunityEventsRepository } from './community-events.repository';

@Module({
  controllers: [CommunityEventsController],
  providers: [CommunityEventsService, CommunityEventsRepository],
  exports: [CommunityEventsService, CommunityEventsRepository],
})
export class CommunityEventsModule {}
