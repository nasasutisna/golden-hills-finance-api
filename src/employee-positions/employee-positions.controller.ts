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
import { EmployeePositionsService } from './employee-positions.service';
import { CreateEmployeePositionDto } from './dto/create-employee-position.dto';
import { UpdateEmployeePositionDto } from './dto/update-employee-position.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Employee Positions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-positions')
export class EmployeePositionsController {
  constructor(private readonly employeePositionsService: EmployeePositionsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Create new employee position',
    description: 'Create a new employee position',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createEmployeePositionDto: CreateEmployeePositionDto) {
    const position = await this.employeePositionsService.create(createEmployeePositionDto);
    return {
      statusCode: 201,
      message: 'Employee position created successfully',
      data: position,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all employee positions',
    description: 'Get paginated list of employee positions',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.employeePositionsService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Employee positions retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active employee positions',
    description: 'Get all active employee positions',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getActive() {
    const positions = await this.employeePositionsService.getActivePositions();
    return {
      statusCode: 200,
      message: 'Active positions retrieved successfully',
      data: positions,
    };
  }

  @Get('department/:department')
  @ApiOperation({
    summary: 'Get positions by department',
    description: 'Get employee positions by department',
  })
  @ApiParam({ name: 'department', description: 'Department name' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByDepartment(@Param('department') department: string) {
    const positions = await this.employeePositionsService.getByDepartment(department);
    return {
      statusCode: 200,
      message: 'Positions retrieved successfully',
      data: positions,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get employee position by ID',
    description: 'Get employee position information by ID',
  })
  @ApiParam({ name: 'id', description: 'Employee Position ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const position = await this.employeePositionsService.findById(id);
    return {
      statusCode: 200,
      message: 'Employee position retrieved successfully',
      data: position,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Update employee position',
    description: 'Update employee position information',
  })
  @ApiParam({ name: 'id', description: 'Employee Position ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateEmployeePositionDto: UpdateEmployeePositionDto,
  ) {
    const position = await this.employeePositionsService.update(id, updateEmployeePositionDto);
    return {
      statusCode: 200,
      message: 'Employee position updated successfully',
      data: position,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete employee position',
    description: 'Soft delete employee position',
  })
  @ApiParam({ name: 'id', description: 'Employee Position ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const position = await this.employeePositionsService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Employee position deleted successfully',
      data: position,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted employee position',
    description: 'Restore a soft deleted employee position',
  })
  @ApiParam({ name: 'id', description: 'Employee Position ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const position = await this.employeePositionsService.restore(id);
    return {
      statusCode: 200,
      message: 'Employee position restored successfully',
      data: position,
    };
  }
}
