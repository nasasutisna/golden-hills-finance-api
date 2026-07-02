import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityEventsService } from './community-events.service';
import { CreateCommunityEventDto } from './dto/create-community-event.dto';
import { UpdateCommunityEventDto } from './dto/update-community-event.dto';
import { QueryCommunityEventsDto } from './dto/query-community-events.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Community Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('community-events')
export class CommunityEventsController {
  constructor(private readonly communityEventsService: CommunityEventsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create a new community event' })
  @ApiResponse({ status: 201, description: 'Community event created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createCommunityEventDto: CreateCommunityEventDto, @CurrentUser('id') userId: string) {
    return this.communityEventsService.create(createCommunityEventDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all community events with pagination' })
  @ApiResponse({ status: 200, description: 'Community events retrieved successfully' })
  findAll(@Query() queryDto: QueryCommunityEventsDto) {
    return this.communityEventsService.findAll(queryDto);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get all upcoming events' })
  @ApiResponse({ status: 200, description: 'Upcoming events retrieved successfully' })
  getUpcomingEvents() {
    return this.communityEventsService.getUpcomingEvents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community event by ID' })
  @ApiResponse({ status: 200, description: 'Community event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Community event not found' })
  findById(@Param('id') id: string) {
    return this.communityEventsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Update community event' })
  @ApiResponse({ status: 200, description: 'Community event updated successfully' })
  @ApiResponse({ status: 404, description: 'Community event not found' })
  update(@Param('id') id: string, @Body() updateCommunityEventDto: UpdateCommunityEventDto) {
    return this.communityEventsService.update(id, updateCommunityEventDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete community event' })
  @ApiResponse({ status: 200, description: 'Community event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Community event not found' })
  remove(@Param('id') id: string) {
    return this.communityEventsService.remove(id);
  }
}
