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
import { ResidentPaymentsService } from './resident-payments.service';
import { CreateResidentPaymentDto } from './dto/create-resident-payment.dto';
import { UpdateResidentPaymentDto } from './dto/update-resident-payment.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Resident Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('resident-payments')
export class ResidentPaymentsController {
  constructor(private readonly residentPaymentsService: ResidentPaymentsService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create new payment',
    description: 'Create a new resident payment',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createResidentPaymentDto: CreateResidentPaymentDto) {
    const payment = await this.residentPaymentsService.create(createResidentPaymentDto);
    return {
      statusCode: 201,
      message: 'Payment created successfully',
      data: payment,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all payments',
    description: 'Get paginated list of resident payments',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.residentPaymentsService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Payments retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get payment statistics',
    description: 'Get payment statistics and totals',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getStatistics(@Query('residentId') residentId?: string) {
    const stats = await this.residentPaymentsService.getPaymentStatistics(residentId);
    return {
      statusCode: 200,
      message: 'Payment statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('resident/:residentId')
  @ApiOperation({
    summary: 'Get payments by resident',
    description: 'Get all payments for a specific resident',
  })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByResident(@Param('residentId', ParseUuidPipe) residentId: string) {
    const payments = await this.residentPaymentsService.getByResident(residentId);
    return {
      statusCode: 200,
      message: 'Payments retrieved successfully',
      data: payments,
    };
  }

  @Get('invoice/:invoiceId')
  @ApiOperation({
    summary: 'Get payments by invoice',
    description: 'Get all payments for a specific invoice',
  })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByInvoice(@Param('invoiceId', ParseUuidPipe) invoiceId: string) {
    const payments = await this.residentPaymentsService.getByInvoice(invoiceId);
    return {
      statusCode: 200,
      message: 'Payments retrieved successfully',
      data: payments,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Get payment information by ID',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const payment = await this.residentPaymentsService.findById(id);
    return {
      statusCode: 200,
      message: 'Payment retrieved successfully',
      data: payment,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Update payment',
    description: 'Update payment information',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateResidentPaymentDto: UpdateResidentPaymentDto,
  ) {
    const payment = await this.residentPaymentsService.update(id, updateResidentPaymentDto);
    return {
      statusCode: 200,
      message: 'Payment updated successfully',
      data: payment,
    };
  }

  @Patch(':id/verify')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Verify payment',
    description: 'Verify and complete payment',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async verifyPayment(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const payment = await this.residentPaymentsService.verifyPayment(id, user.id);
    return {
      statusCode: 200,
      message: 'Payment verified successfully',
      data: payment,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete payment',
    description: 'Soft delete payment',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const payment = await this.residentPaymentsService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Payment deleted successfully',
      data: payment,
    };
  }
}
