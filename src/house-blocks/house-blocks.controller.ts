import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { HouseBlocksService } from './house-blocks.service';
import { CreateHouseBlockDto } from './dto/create-house-block.dto';
import { UpdateHouseBlockDto } from './dto/update-house-block.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('House Blocks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('house-blocks')
export class HouseBlocksController {
  constructor(private readonly houseBlocksService: HouseBlocksService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Create new house block',
    description: 'Create a new house block/building',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createHouseBlockDto: CreateHouseBlockDto) {
    const houseBlock = await this.houseBlocksService.create(createHouseBlockDto);
    return {
      statusCode: 201,
      message: 'House block created successfully',
      data: houseBlock,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all house blocks',
    description: 'Get paginated list of house blocks',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.houseBlocksService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'House blocks retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('occupancy/stats')
  @ApiOperation({
    summary: 'Get occupancy statistics',
    description: 'Get occupancy statistics for all house blocks',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getOccupancyStats() {
    const stats = await this.houseBlocksService.getOccupancyStats();
    return {
      statusCode: 200,
      message: 'Occupancy statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get house block by ID',
    description: 'Get house block information by ID',
  })
  @ApiParam({ name: 'id', description: 'House Block ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const houseBlock = await this.houseBlocksService.findById(id);
    return {
      statusCode: 200,
      message: 'House block retrieved successfully',
      data: houseBlock,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Update house block',
    description: 'Update house block information',
  })
  @ApiParam({ name: 'id', description: 'House Block ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateHouseBlockDto: UpdateHouseBlockDto,
  ) {
    const houseBlock = await this.houseBlocksService.update(id, updateHouseBlockDto);
    return {
      statusCode: 200,
      message: 'House block updated successfully',
      data: houseBlock,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete house block',
    description: 'Soft delete house block',
  })
  @ApiParam({ name: 'id', description: 'House Block ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const houseBlock = await this.houseBlocksService.softDelete(id);
    return {
      statusCode: 200,
      message: 'House block deleted successfully',
      data: houseBlock,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted house block',
    description: 'Restore a soft deleted house block',
  })
  @ApiParam({ name: 'id', description: 'House Block ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const houseBlock = await this.houseBlocksService.restore(id);
    return {
      statusCode: 200,
      message: 'House block restored successfully',
      data: houseBlock,
    };
  }
}
