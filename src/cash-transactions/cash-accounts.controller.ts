import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CashTransactionsService } from './cash-transactions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Cash Accounts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-accounts')
export class CashAccountsController {
  constructor(private readonly cashTransactionsService: CashTransactionsService) {}

  @Get()
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'List cash accounts (Kas)', description: 'List all cash accounts' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll() {
    const data = await this.cashTransactionsService.getCashAccounts();
    return { statusCode: 200, message: 'Cash accounts retrieved successfully', data };
  }

  @Get('balances')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Get balances for all cash accounts',
    description: 'Per-account opening balance, all-time balance, and optional period flow',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async balances(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.cashTransactionsService.getAccountBalances(startDate, endDate);
    return { statusCode: 200, message: 'Cash account balances retrieved successfully', data };
  }

  @Get(':id/balance')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get balance for one cash account' })
  @ApiParam({ name: 'id', description: 'Cash Account ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async balance(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const all = await this.cashTransactionsService.getAccountBalances(startDate, endDate);
    const data = (all as any[]).find((a) => a.id === id);
    return { statusCode: 200, message: 'Cash account balance retrieved successfully', data };
  }
}
