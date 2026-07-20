import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Get dashboard overview (Admin/Accountant only)',
    description:
      'Aggregated overview for the admin dashboard: house unit counts, current IPL period collection status, per-Kas (IPL/Warga) monthly flow, all-time balances, consolidated monthly income/expense chart, and recent transactions.',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getOverview() {
    const data = await this.dashboardService.getOverview();
    return {
      statusCode: 200,
      message: 'Dashboard overview retrieved successfully',
      data,
    };
  }
}
