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
import { CashTransactionsService } from './cash-transactions.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Cash Transactions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-transactions')
export class CashTransactionsController {
  constructor(private readonly cashTransactionsService: CashTransactionsService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create new cash transaction',
    description: 'Create a new cash transaction',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(
    @Body() createCashTransactionDto: CreateCashTransactionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const transaction = await this.cashTransactionsService.create(createCashTransactionDto, user);
    return {
      statusCode: 201,
      message: 'Cash transaction created successfully',
      data: transaction,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all cash transactions',
    description: 'Get paginated list of cash transactions',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.cashTransactionsService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Cash transactions retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get transaction statistics',
    description: 'Get cash transaction statistics and totals',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.cashTransactionsService.getTransactionStatistics(startDate, endDate);
    return {
      statusCode: 200,
      message: 'Transaction statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('type/:transactionType')
  @ApiOperation({
    summary: 'Get transactions by type',
    description: 'Get transactions by type (INCOME/EXPENSE)',
  })
  @ApiParam({ name: 'transactionType', description: 'Transaction type' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByType(@Param('transactionType') transactionType: string) {
    const transactions = await this.cashTransactionsService.getByType(transactionType);
    return {
      statusCode: 200,
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get('category/:categoryId')
  @ApiOperation({
    summary: 'Get transactions by category',
    description: 'Get transactions by category',
  })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByCategory(@Param('categoryId', ParseUuidPipe) categoryId: string) {
    const transactions = await this.cashTransactionsService.getByCategory(categoryId);
    return {
      statusCode: 200,
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get('date-range')
  @ApiOperation({
    summary: 'Get transactions by date range',
    description: 'Get transactions within a date range',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const transactions = await this.cashTransactionsService.getByDateRange(startDate, endDate);
    return {
      statusCode: 200,
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get('approval-status/:approvalStatus')
  @ApiOperation({
    summary: 'Get transactions by approval status',
    description: 'Get transactions by approval status',
  })
  @ApiParam({ name: 'approvalStatus', description: 'Approval status' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByApprovalStatus(@Param('approvalStatus') approvalStatus: string) {
    const transactions = await this.cashTransactionsService.getByApprovalStatus(approvalStatus);
    return {
      statusCode: 200,
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get cash transaction by ID',
    description: 'Get cash transaction information by ID',
  })
  @ApiParam({ name: 'id', description: 'Cash Transaction ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const transaction = await this.cashTransactionsService.findById(id);
    return {
      statusCode: 200,
      message: 'Cash transaction retrieved successfully',
      data: transaction,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Update cash transaction',
    description: 'Update cash transaction information',
  })
  @ApiParam({ name: 'id', description: 'Cash Transaction ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateCashTransactionDto: UpdateCashTransactionDto,
  ) {
    const transaction = await this.cashTransactionsService.update(id, updateCashTransactionDto);
    return {
      statusCode: 200,
      message: 'Cash transaction updated successfully',
      data: transaction,
    };
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Approve transaction',
    description: 'Approve a pending cash transaction',
  })
  @ApiParam({ name: 'id', description: 'Cash Transaction ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async approveTransaction(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const transaction = await this.cashTransactionsService.approveTransaction(id, user);
    return {
      statusCode: 200,
      message: 'Transaction approved successfully',
      data: transaction,
    };
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Reject transaction',
    description: 'Reject a pending cash transaction',
  })
  @ApiParam({ name: 'id', description: 'Cash Transaction ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async rejectTransaction(
    @Param('id', ParseUuidPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const transaction = await this.cashTransactionsService.rejectTransaction(id, reason, user);
    return {
      statusCode: 200,
      message: 'Transaction rejected successfully',
      data: transaction,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete cash transaction',
    description: 'Soft delete cash transaction',
  })
  @ApiParam({ name: 'id', description: 'Cash Transaction ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const transaction = await this.cashTransactionsService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Cash transaction deleted successfully',
      data: transaction,
    };
  }
}
