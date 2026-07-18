import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ExpenseRequestsService } from './expense-requests.service';
import { CreateExpenseRequestDto } from './dto/create-expense-request.dto';
import { ApproveExpenseRequestDto } from './dto/approve-expense-request.dto';
import { RejectExpenseRequestDto } from './dto/reject-expense-request.dto';
import { QueryExpenseRequestDto } from './dto/query-expense-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Expense Requests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expense-requests')
export class ExpenseRequestsController {
  constructor(private readonly expenseRequestsService: ExpenseRequestsService) {}

  @Post()
  @Roles('PENGURUS', 'COORDINATOR', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create expense request (Pengurus, Coordinator, Admin, Accountant)',
    description:
      'Submit an expense/pengeluaran request with optional proof photos (fileIds). ' +
      'Auto-approved at creation for ADMIN/ACCOUNTANT; PENDING otherwise. ' +
      'Proof photos must first be uploaded via /file-attachments/upload/multiple.',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createDto: CreateExpenseRequestDto,
  ) {
    const request = await this.expenseRequestsService.create(userId, createDto);
    return {
      statusCode: 201,
      message:
        request.status === 'APPROVED'
          ? 'Expense request created and auto-approved'
          : 'Expense request submitted, pending approval',
      data: request,
    };
  }

  @Get()
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'List all expense requests (Admin, Accountant, Manager)' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() query: QueryExpenseRequestDto) {
    return await this.expenseRequestsService.findAll(query);
  }

  @Get('pending')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'List pending expense requests (Admin, Accountant)' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findPending(@Query() query: QueryExpenseRequestDto) {
    return await this.expenseRequestsService.findPending(query);
  }

  @Get('mine')
  @Roles('PENGURUS', 'COORDINATOR', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'List my expense requests' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryExpenseRequestDto,
  ) {
    return await this.expenseRequestsService.findMyRequests(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense request detail' })
  @ApiParam({ name: 'id', description: 'Expense request ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    const request = await this.expenseRequestsService.findOne(id, userId);
    return {
      statusCode: 200,
      message: 'Expense request retrieved successfully',
      data: request,
    };
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Approve expense request (Admin, Accountant)',
    description:
      'Approves a PENDING request and auto-creates an EXPENSE CashTransaction (posted to ledger).',
  })
  @ApiParam({ name: 'id', description: 'Expense request ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async approve(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: ApproveExpenseRequestDto,
  ) {
    const request = await this.expenseRequestsService.approve(id, userId, dto);
    return {
      statusCode: 200,
      message: 'Expense request approved and posted to ledger',
      data: request,
    };
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Reject expense request (Admin, Accountant)',
    description: 'Rejects a PENDING request. No CashTransaction is created.',
  })
  @ApiParam({ name: 'id', description: 'Expense request ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async reject(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: RejectExpenseRequestDto,
  ) {
    const request = await this.expenseRequestsService.reject(id, userId, dto);
    return {
      statusCode: 200,
      message: 'Expense request rejected',
      data: request,
    };
  }

  @Patch(':id/cancel')
  @Roles('PENGURUS', 'COORDINATOR', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'STAFF')
  @ApiOperation({
    summary: 'Cancel my own PENDING expense request',
    description: 'Only the requester can cancel, and only while the request is PENDING.',
  })
  @ApiParam({ name: 'id', description: 'Expense request ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    const request = await this.expenseRequestsService.cancel(id, userId);
    return {
      statusCode: 200,
      message: 'Expense request cancelled',
      data: request,
    };
  }
}
