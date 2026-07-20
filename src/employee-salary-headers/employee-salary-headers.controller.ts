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
import { EmployeeSalaryHeadersService } from './employee-salary-headers.service';
import { CreateEmployeeSalaryHeaderDto } from './dto/create-employee-salary-header.dto';
import { CreateSimplePayrollDto } from './dto/create-simple-payroll.dto';
import { UpdateEmployeeSalaryHeaderDto } from './dto/update-employee-salary-header.dto';
import { QueryEmployeeSalaryHeadersDto } from './dto/query-employee-salary-headers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Employee Salary Headers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-salary-headers')
export class EmployeeSalaryHeadersController {
  constructor(private readonly employeeSalaryHeadersService: EmployeeSalaryHeadersService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Create a new employee salary header' })
  @ApiResponse({ status: 201, description: 'Employee salary header created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Payroll number already exists' })
  create(@Body() createEmployeeSalaryHeaderDto: CreateEmployeeSalaryHeaderDto) {
    return this.employeeSalaryHeadersService.create(createEmployeeSalaryHeaderDto);
  }

  @Post('simple')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Penggajian sederhana: catat gaji (1 angka) & langsung posting pengeluaran Kas IPL',
  })
  @ApiResponse({ status: 201, description: 'Payroll created and IPL expense posted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Salary for this employee/period already exists' })
  createSimplePayroll(
    @Body() dto: CreateSimplePayrollDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.employeeSalaryHeadersService.createSimplePayroll(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employee salary headers with pagination' })
  @ApiResponse({ status: 200, description: 'Employee salary headers retrieved successfully' })
  findAll(@Query() queryDto: QueryEmployeeSalaryHeadersDto) {
    return this.employeeSalaryHeadersService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee salary header by ID' })
  @ApiResponse({ status: 200, description: 'Employee salary header retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary header not found' })
  findById(@Param('id') id: string) {
    return this.employeeSalaryHeadersService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Update employee salary header' })
  @ApiResponse({ status: 200, description: 'Employee salary header updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary header not found' })
  @ApiResponse({ status: 409, description: 'Cannot modify locked payroll' })
  update(@Param('id') id: string, @Body() updateEmployeeSalaryHeaderDto: UpdateEmployeeSalaryHeaderDto) {
    return this.employeeSalaryHeadersService.update(id, updateEmployeeSalaryHeaderDto);
  }

  @Patch(':id/calculate')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Calculate employee salary' })
  @ApiResponse({ status: 200, description: 'Employee salary calculated successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary header not found' })
  @ApiResponse({ status: 409, description: 'Cannot calculate locked payroll or invalid status' })
  calculateSalary(@Param('id') id: string) {
    return this.employeeSalaryHeadersService.calculateSalary(id);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Approve employee salary' })
  @ApiResponse({ status: 200, description: 'Employee salary approved successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary header not found' })
  @ApiResponse({ status: 409, description: 'Cannot approve locked payroll or invalid status' })
  approveSalary(@Param('id') id: string, @CurrentUser('id') approverId: string) {
    return this.employeeSalaryHeadersService.approveSalary(id, approverId);
  }

  @Patch(':id/pay')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Mark employee salary as paid' })
  @ApiResponse({ status: 200, description: 'Employee salary marked as paid successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary header not found' })
  @ApiResponse({ status: 409, description: 'Cannot mark as paid with invalid status' })
  markAsPaid(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('paymentDate') paymentDate?: string,
  ) {
    return this.employeeSalaryHeadersService.markAsPaid(
      id,
      paymentDate ? new Date(paymentDate) : undefined,
      userId,
    );
  }

  @Patch(':id/cancel')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Batalkan penggajian (CANCELLED) & hapus transaksi Kas IPL tertaut',
  })
  @ApiResponse({ status: 200, description: 'Payroll cancelled, IPL expense removed' })
  @ApiResponse({ status: 404, description: 'Employee salary header not found' })
  @ApiResponse({ status: 409, description: 'Only PAID payroll can be cancelled' })
  cancelPayroll(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.employeeSalaryHeadersService.cancelPayroll(id, userId, reason);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete employee salary header' })
  @ApiResponse({ status: 200, description: 'Employee salary header deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee salary header not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete locked payroll' })
  remove(@Param('id') id: string) {
    return this.employeeSalaryHeadersService.remove(id);
  }
}
