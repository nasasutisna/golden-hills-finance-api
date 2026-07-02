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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Employees')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Create new employee',
    description: 'Create a new employee',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    const employee = await this.employeesService.create(createEmployeeDto);
    return {
      statusCode: 201,
      message: 'Employee created successfully',
      data: employee,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all employees',
    description: 'Get paginated list of employees',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.employeesService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Employees retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get employee statistics',
    description: 'Get employee statistics and totals',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getStatistics() {
    const stats = await this.employeesService.getEmployeeStatistics();
    return {
      statusCode: 200,
      message: 'Employee statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('position/:positionId')
  @ApiOperation({
    summary: 'Get employees by position',
    description: 'Get all employees in a specific position',
  })
  @ApiParam({ name: 'positionId', description: 'Position ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByPosition(@Param('positionId', ParseUuidPipe) positionId: string) {
    const employees = await this.employeesService.getByPosition(positionId);
    return {
      statusCode: 200,
      message: 'Employees retrieved successfully',
      data: employees,
    };
  }

  @Get('department/:department')
  @ApiOperation({
    summary: 'Get employees by department',
    description: 'Get all employees in a specific department',
  })
  @ApiParam({ name: 'department', description: 'Department name' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByDepartment(@Param('department') department: string) {
    const employees = await this.employeesService.getByDepartment(department);
    return {
      statusCode: 200,
      message: 'Employees retrieved successfully',
      data: employees,
    };
  }

  @Get('status/:status')
  @ApiOperation({
    summary: 'Get employees by employment status',
    description: 'Get employees by employment status',
  })
  @ApiParam({ name: 'status', description: 'Employment status' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByEmploymentStatus(@Param('status') status: string) {
    const employees = await this.employeesService.getByEmploymentStatus(status);
    return {
      statusCode: 200,
      message: 'Employees retrieved successfully',
      data: employees,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get employee by ID',
    description: 'Get employee information by ID',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const employee = await this.employeesService.findById(id);
    return {
      statusCode: 200,
      message: 'Employee retrieved successfully',
      data: employee,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Update employee',
    description: 'Update employee information',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const employee = await this.employeesService.update(id, updateEmployeeDto);
    return {
      statusCode: 200,
      message: 'Employee updated successfully',
      data: employee,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete employee',
    description: 'Soft delete employee',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const employee = await this.employeesService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Employee deleted successfully',
      data: employee,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted employee',
    description: 'Restore a soft deleted employee',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const employee = await this.employeesService.restore(id);
    return {
      statusCode: 200,
      message: 'Employee restored successfully',
      data: employee,
    };
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Deactivate employee',
    description: 'Deactivate an employee',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async deactivate(@Param('id', ParseUuidPipe) id: string) {
    const employee = await this.employeesService.deactivate(id);
    return {
      statusCode: 200,
      message: 'Employee deactivated successfully',
      data: employee,
    };
  }

  @Patch(':id/activate')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Activate employee',
    description: 'Activate an employee',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async activate(@Param('id', ParseUuidPipe) id: string) {
    const employee = await this.employeesService.activate(id);
    return {
      statusCode: 200,
      message: 'Employee activated successfully',
      data: employee,
    };
  }
}
