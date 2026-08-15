import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Approvals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @Roles('ADMIN', 'ACCOUNTANT', 'SUPERADMIN')
  @ApiOperation({
    summary: 'Get all pending approvals (Admin/Accountant/Superadmin only)',
    description:
      'Unified pending-approval queue across IPL payments, resident payments (Iuran Warga) ' +
      'and expense requests, including proof-of-transfer files, unit/resident info and ' +
      'covered months (IPL only — resident payments carry no per-month data).',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getPending() {
    const data = await this.approvalsService.getPendingApprovals();
    return {
      statusCode: 200,
      message: 'Pending approvals retrieved successfully',
      data,
    };
  }
}
