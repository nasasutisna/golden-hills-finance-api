import {
  Controller,
  Get,
  Post,
  Put,
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
import { SecuritySchedulesService } from './security-schedules.service';
import { CreateSecurityScheduleDto } from './dto/create-security-schedule.dto';
import { UpdateSecurityScheduleDto } from './dto/update-security-schedule.dto';
import { GenerateSecurityScheduleDto } from './dto/generate-security-schedule.dto';
import { SetDaySecurityScheduleDto } from './dto/set-day-security-schedule.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Security Schedules')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('security-schedules')
export class SecuritySchedulesController {
  constructor(
    private readonly securitySchedulesService: SecuritySchedulesService,
  ) {}

  @Post('generate')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Auto-generate a month of security schedules',
    description:
      'Generate a full month of security guard schedules using a fair rotation (2 guards/shift, Pagi 08-20 / Malam 20-08, ≥1 day off/week). Wipes the month first.',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async generate(@Body() generateDto: GenerateSecurityScheduleDto) {
    const result = await this.securitySchedulesService.generateMonth(
      generateDto.year,
      generateDto.month,
      generateDto.pairs,
    );
    return {
      statusCode: 201,
      message: `Berhasil generate ${result.created} penugasan untuk ${generateDto.year}-${generateDto.month}`,
      data: result,
    };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Create a single security schedule entry (manual override)',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createSecurityScheduleDto: CreateSecurityScheduleDto) {
    const schedule = await this.securitySchedulesService.create(
      createSecurityScheduleDto,
    );
    return {
      statusCode: 201,
      message: 'Security schedule created successfully',
      data: schedule,
    };
  }

  @Put('day/:date')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Replace one day of security schedules (manual day editor)',
    description:
      'Wipes all assignments for the given date and recreates them from the pagi/malam employee id arrays. Idempotent. Used to migrate an already-running schedule or to manually pick shift pairs.',
  })
  @ApiParam({ name: 'date', description: 'Date (YYYY-MM-DD)' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async setDay(
    @Param('date') date: string,
    @Body() dto: SetDaySecurityScheduleDto,
  ) {
    const result = await this.securitySchedulesService.setDay(date, dto);
    return {
      statusCode: 200,
      message: `Jadwal tanggal ${date} diperbarui (${result.created} penugasan)`,
      data: result,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get security schedules (optionally filtered by month)',
  })
  @ApiQuery({ name: 'year', required: false, description: 'Filter year (e.g. 2026)' })
  @ApiQuery({ name: 'month', required: false, description: 'Filter month 1-12' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(
    @Query() queryOptions: QueryOptionsDto,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const result = await this.securitySchedulesService.findAll(
      queryOptions,
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
    );
    return {
      statusCode: 200,
      message: 'Security schedules retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a security schedule by ID' })
  @ApiParam({ name: 'id', description: 'Security Schedule ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const schedule = await this.securitySchedulesService.findById(id);
    return {
      statusCode: 200,
      message: 'Security schedule retrieved successfully',
      data: schedule,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a security schedule entry' })
  @ApiParam({ name: 'id', description: 'Security Schedule ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateSecurityScheduleDto: UpdateSecurityScheduleDto,
  ) {
    const schedule = await this.securitySchedulesService.update(
      id,
      updateSecurityScheduleDto,
    );
    return {
      statusCode: 200,
      message: 'Security schedule updated successfully',
      data: schedule,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Soft delete a security schedule entry' })
  @ApiParam({ name: 'id', description: 'Security Schedule ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const schedule = await this.securitySchedulesService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Security schedule deleted successfully',
      data: schedule,
    };
  }
}
