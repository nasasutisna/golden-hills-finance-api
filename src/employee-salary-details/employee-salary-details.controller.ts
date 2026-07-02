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
import { EmployeeSalaryDetailsService } from './employee-salary-details.service';
import { CreateEmployeeSalaryDetailDto } from './dto/create-employee-salary-detail.dto';
import { UpdateEmployeeSalaryDetailDto } from './dto/update-employee-salary-detail.dto';
import { QueryEmployeeSalaryDetailsDto } from './dto/query-employee-salary-details.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Employee Salary Details')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-salary-details')
export class EmployeeSalaryDetailsController {
  constructor(private readonly employeeSalaryDetailsService: EmployeeSalaryDetailsService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Create a new employee salary detail' })
  @ApiResponse({ status: 201, description: 'Employee salary detail created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Component already exists for this header or payroll is locked' })
  create(@Body() createEmployeeSalaryDetailDto: CreateEmployeeSalaryDetailDto) {
    return this.employeeSalaryDetailsService.create(createEmployeeSalaryDetailDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employee salary details with pagination' })
  @ApiResponse({ status: 200, description: 'Employee salary details retrieved successfully' })
  findAll(@Query() queryDto: QueryEmployeeSalaryDetailsDto) {
    return this.employeeSalaryDetailsService.findAll(queryDto);
  }

  @Get('header/:salaryHeaderId')
  @ApiOperation({ summary: 'Get all salary details for a specific header' })
  @ApiResponse({ status: 200, description: 'Salary details retrieved successfully' })
  findBySalaryHeader(@Param('salaryHeaderId') salaryHeaderId: string) {
    return this.employeeSalaryDetailsService.findBySalaryHeader(salaryHeaderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee salary detail by ID' })
  @ApiResponse({ status: 200, description: 'Employee salary detail retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary detail not found' })
  findById(@Param('id') id: string) {
    return this.employeeSalaryDetailsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Update employee salary detail' })
  @ApiResponse({ status: 200, description: 'Employee salary detail updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary detail not found' })
  @ApiResponse({ status: 409, description: 'Cannot modify details of locked payroll' })
  update(@Param('id') id: string, @Body() updateEmployeeSalaryDetailDto: UpdateEmployeeSalaryDetailDto) {
    return this.employeeSalaryDetailsService.update(id, updateEmployeeSalaryDetailDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete employee salary detail' })
  @ApiResponse({ status: 200, description: 'Employee salary detail deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary detail not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete details from locked payroll' })
  remove(@Param('id') id: string) {
    return this.employeeSalaryDetailsService.remove(id);
  }
}
