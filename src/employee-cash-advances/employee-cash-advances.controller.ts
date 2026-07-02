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
import { EmployeeCashAdvancesService } from './employee-cash-advances.service';
import { CreateEmployeeCashAdvanceDto } from './dto/create-employee-cash-advance.dto';
import { UpdateEmployeeCashAdvanceDto } from './dto/update-employee-cash-advance.dto';
import { QueryEmployeeCashAdvancesDto } from './dto/query-employee-cash-advances.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Employee Cash Advances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-cash-advances')
export class EmployeeCashAdvancesController {
  constructor(private readonly employeeCashAdvancesService: EmployeeCashAdvancesService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create a new employee cash advance request' })
  @ApiResponse({ status: 201, description: 'Employee cash advance created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Advance number already exists' })
  create(@Body() createEmployeeCashAdvanceDto: CreateEmployeeCashAdvanceDto, @CurrentUser('id') userId: string) {
    return this.employeeCashAdvancesService.create(createEmployeeCashAdvanceDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employee cash advances with pagination' })
  @ApiResponse({ status: 200, description: 'Employee cash advances retrieved successfully' })
  findAll(@Query() queryDto: QueryEmployeeCashAdvancesDto) {
    return this.employeeCashAdvancesService.findAll(queryDto);
  }

  @Get('pending')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get all pending advances awaiting approval' })
  @ApiResponse({ status: 200, description: 'Pending advances retrieved successfully' })
  findPendingApproval() {
    return this.employeeCashAdvancesService.findPendingApproval();
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get all cash advances for an employee' })
  @ApiResponse({ status: 200, description: 'Cash advances retrieved successfully' })
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.employeeCashAdvancesService.findByEmployee(employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee cash advance by ID' })
  @ApiResponse({ status: 200, description: 'Employee cash advance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee cash advance not found' })
  findById(@Param('id') id: string) {
    return this.employeeCashAdvancesService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update employee cash advance' })
  @ApiResponse({ status: 200, description: 'Employee cash advance updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee cash advance not found' })
  update(@Param('id') id: string, @Body() updateEmployeeCashAdvanceDto: UpdateEmployeeCashAdvanceDto) {
    return this.employeeCashAdvancesService.update(id, updateEmployeeCashAdvanceDto);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Approve employee cash advance' })
  @ApiResponse({ status: 200, description: 'Employee cash advance approved successfully' })
  @ApiResponse({ status: 404, description: 'Employee cash advance not found' })
  @ApiResponse({ status: 409, description: 'Cannot approve advance with current status' })
  approveAdvance(
    @Param('id') id: string,
    @CurrentUser('id') approverId: string,
    @Body('notes') notes?: string,
  ) {
    return this.employeeCashAdvancesService.approveAdvance(id, approverId, notes);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Reject employee cash advance' })
  @ApiResponse({ status: 200, description: 'Employee cash advance rejected successfully' })
  @ApiResponse({ status: 404, description: 'Employee cash advance not found' })
  @ApiResponse({ status: 409, description: 'Cannot reject advance with current status' })
  rejectAdvance(
    @Param('id') id: string,
    @CurrentUser('id') approverId: string,
    @Body('notes') notes?: string,
  ) {
    return this.employeeCashAdvancesService.rejectAdvance(id, approverId, notes);
  }

  @Patch(':id/disburse')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Disburse approved cash advance' })
  @ApiResponse({ status: 200, description: 'Cash advance disbursed successfully' })
  @ApiResponse({ status: 404, description: 'Employee cash advance not found' })
  @ApiResponse({ status: 409, description: 'Cannot disburse advance with current status' })
  disburseAdvance(@Param('id') id: string, @Body('disbursementDate') disbursementDate?: string) {
    return this.employeeCashAdvancesService.disburseAdvance(id, disbursementDate ? new Date(disbursementDate) : undefined);
  }

  @Patch(':id/repay')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Record repayment for cash advance' })
  @ApiResponse({ status: 200, description: 'Repayment recorded successfully' })
  @ApiResponse({ status: 404, description: 'Employee cash advance not found' })
  @ApiResponse({ status: 409, description: 'Cannot record repayment for advance with current status' })
  recordRepayment(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('paymentDate') paymentDate?: string,
    @Body('notes') notes?: string,
  ) {
    return this.employeeCashAdvancesService.recordRepayment(id, amount, paymentDate ? new Date(paymentDate) : undefined, notes);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete employee cash advance' })
  @ApiResponse({ status: 200, description: 'Employee cash advance deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee cash advance not found' })
  remove(@Param('id') id: string) {
    return this.employeeCashAdvancesService.remove(id);
  }
}
