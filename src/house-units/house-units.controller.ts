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
  ApiQuery,
} from '@nestjs/swagger';
import { HouseUnitsService } from './house-units.service';
import { CreateHouseUnitDto } from './dto/create-house-unit.dto';
import { UpdateHouseUnitDto } from './dto/update-house-unit.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('House Units')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('house-units')
export class HouseUnitsController {
  constructor(private readonly houseUnitsService: HouseUnitsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Create new house unit',
    description: 'Create a new house unit with physical and occupancy data',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createHouseUnitDto: CreateHouseUnitDto) {
    const houseUnit = await this.houseUnitsService.create(createHouseUnitDto);
    return {
      statusCode: 201,
      message: 'House unit created successfully',
      data: houseUnit,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all house units',
    description: 'Get paginated list of house units',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.houseUnitsService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'House units retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('stats/occupancy')
  @ApiOperation({
    summary: 'Get occupancy statistics',
    description: 'Get detailed occupancy statistics by status',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getOccupancyStats() {
    const stats = await this.houseUnitsService.getOccupancyStats();
    return {
      statusCode: 200,
      message: 'Occupancy statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('by-status/:status')
  @ApiOperation({
    summary: 'Get units by occupancy status',
    description: 'Get all units filtered by occupancy status (FULLY_OCCUPIED, OCCASIONALLY, VACANT, RENTED)',
  })
  @ApiParam({ name: 'status', description: 'Occupancy status', enum: ['FULLY_OCCUPIED', 'OCCASIONALLY', 'VACANT', 'RENTED'] })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getUnitsByStatus(@Param('status') status: string) {
    const units = await this.houseUnitsService.getUnitsByOccupancyStatus(status);
    return {
      statusCode: 200,
      message: `Units with status ${status} retrieved successfully`,
      data: units,
    };
  }

  @Get('bank-buyback')
  @ApiOperation({
    summary: 'Get bank buyback units',
    description: 'Get all units that have been buyback by bank',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getBankBuybackUnits() {
    const units = await this.houseUnitsService.getBankBuybackUnits();
    return {
      statusCode: 200,
      message: 'Bank buyback units retrieved successfully',
      data: units,
    };
  }

  @Get('block/:blockId')
  @ApiOperation({
    summary: 'Get units by house block',
    description: 'Get all units within a specific house block',
  })
  @ApiParam({ name: 'blockId', description: 'House Block ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByHouseBlock(@Param('blockId', ParseUuidPipe) blockId: string) {
    const units = await this.houseUnitsService.findByHouseBlock(blockId);
    return {
      statusCode: 200,
      message: 'House units retrieved successfully',
      data: units,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get house unit by ID',
    description: 'Get house unit information by ID',
  })
  @ApiParam({ name: 'id', description: 'House Unit ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const houseUnit = await this.houseUnitsService.findById(id);
    return {
      statusCode: 200,
      message: 'House unit retrieved successfully',
      data: houseUnit,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Update house unit',
    description: 'Update house unit information',
  })
  @ApiParam({ name: 'id', description: 'House Unit ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateHouseUnitDto: UpdateHouseUnitDto,
  ) {
    const houseUnit = await this.houseUnitsService.update(id, updateHouseUnitDto);
    return {
      statusCode: 200,
      message: 'House unit updated successfully',
      data: houseUnit,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete house unit',
    description: 'Soft delete house unit',
  })
  @ApiParam({ name: 'id', description: 'House Unit ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const houseUnit = await this.houseUnitsService.softDelete(id);
    return {
      statusCode: 200,
      message: 'House unit deleted successfully',
      data: houseUnit,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted house unit',
    description: 'Restore a soft deleted house unit',
  })
  @ApiParam({ name: 'id', description: 'House Unit ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const houseUnit = await this.houseUnitsService.restore(id);
    return {
      statusCode: 200,
      message: 'House unit restored successfully',
      data: houseUnit,
    };
  }
}
