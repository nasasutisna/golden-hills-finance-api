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
import { IplPeriodsService } from './ipl-periods.service';
import { CreateIplPeriodDto } from './dto/create-ipl-period.dto';
import { UpdateIplPeriodDto } from './dto/update-ipl-period.dto';
import { QueryIplPeriodsDto } from './dto/query-ipl-periods.dto';
import { GenerateIplPeriodsDto } from './dto/generate-ipl-periods.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('IPL Periods')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ipl-periods')
export class IplPeriodsController {
  constructor(private readonly iplPeriodsService: IplPeriodsService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create new IPL period',
    description: 'Create a new IPL payment period (bulan tahun)',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createIplPeriodDto: CreateIplPeriodDto) {
    const period = await this.iplPeriodsService.create(createIplPeriodDto);
    return {
      statusCode: 201,
      message: 'IPL period created successfully',
      data: period,
    };
  }

  @Post('generate')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Generate IPL periods for a full year (Jan-Dec)',
    description:
      'Create all 12 monthly periods for the given year in one transaction. ' +
      'Months that already exist are skipped. Optionally derive a per-month dueDate from a dueDay.',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async generate(@Body() generateDto: GenerateIplPeriodsDto) {
    const result = await this.iplPeriodsService.generateYear(generateDto);
    return {
      statusCode: 201,
      message: 'IPL periods generated successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all IPL periods',
    description: 'Get paginated list of IPL payment periods',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryIplPeriodsDto) {
    const result = await this.iplPeriodsService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'IPL periods retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('with-stats')
  @ApiOperation({
    summary: 'Get IPL periods with payment statistics',
    description: 'Get paginated list of IPL periods with payment stats (count, amounts by status)',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findWithStats(@Query() queryOptions: QueryIplPeriodsDto) {
    const result = await this.iplPeriodsService.findWithStats(queryOptions);
    return {
      statusCode: 200,
      message: 'IPL periods with stats retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active IPL periods',
    description: 'Get all active IPL periods',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getActive() {
    const periods = await this.iplPeriodsService.getActivePeriods();
    return {
      statusCode: 200,
      message: 'Active IPL periods retrieved successfully',
      data: periods,
    };
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current IPL period',
    description: 'Get the current IPL period based on current month/year',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getCurrent() {
    const period = await this.iplPeriodsService.getCurrentPeriod();
    return {
      statusCode: 200,
      message: 'Current IPL period retrieved successfully',
      data: period,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get IPL period by ID',
    description: 'Get a specific IPL period by ID',
  })
  @ApiParam({ name: 'id', description: 'Period ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findById(@Param('id', ParseUuidPipe) id: string) {
    const period = await this.iplPeriodsService.findById(id);
    return {
      statusCode: 200,
      message: 'IPL period retrieved successfully',
      data: period,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Update IPL period',
    description: 'Update an existing IPL period',
  })
  @ApiParam({ name: 'id', description: 'Period ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateIplPeriodDto: UpdateIplPeriodDto,
  ) {
    const period = await this.iplPeriodsService.update(id, updateIplPeriodDto);
    return {
      statusCode: 200,
      message: 'IPL period updated successfully',
      data: period,
    };
  }

  @Delete(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Delete IPL period',
    description: 'Soft delete an IPL period',
  })
  @ApiParam({ name: 'id', description: 'Period ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const period = await this.iplPeriodsService.softDelete(id);
    return {
      statusCode: 200,
      message: 'IPL period deleted successfully',
      data: period,
    };
  }
}
