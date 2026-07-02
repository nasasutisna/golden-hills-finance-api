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
import { ResidentInvoicesService } from './resident-invoices.service';
import { CreateResidentInvoiceDto } from './dto/create-resident-invoice.dto';
import { UpdateResidentInvoiceDto } from './dto/update-resident-invoice.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Resident Invoices')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('resident-invoices')
export class ResidentInvoicesController {
  constructor(private readonly residentInvoicesService: ResidentInvoicesService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create new invoice',
    description: 'Create a new resident invoice',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createResidentInvoiceDto: CreateResidentInvoiceDto) {
    const invoice = await this.residentInvoicesService.create(createResidentInvoiceDto);
    return {
      statusCode: 201,
      message: 'Invoice created successfully',
      data: invoice,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all invoices',
    description: 'Get paginated list of resident invoices',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.residentInvoicesService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Invoices retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get invoice statistics',
    description: 'Get invoice statistics and totals',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getStatistics(@Query('residentId') residentId?: string) {
    const stats = await this.residentInvoicesService.getInvoiceStatistics(residentId);
    return {
      statusCode: 200,
      message: 'Invoice statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('overdue')
  @ApiOperation({
    summary: 'Get overdue invoices',
    description: 'Get all overdue invoices',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getOverdue() {
    const invoices = await this.residentInvoicesService.getOverdueInvoices();
    return {
      statusCode: 200,
      message: 'Overdue invoices retrieved successfully',
      data: invoices,
    };
  }

  @Get('resident/:residentId')
  @ApiOperation({
    summary: 'Get invoices by resident',
    description: 'Get all invoices for a specific resident',
  })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByResident(@Param('residentId', ParseUuidPipe) residentId: string) {
    const invoices = await this.residentInvoicesService.getByResident(residentId);
    return {
      statusCode: 200,
      message: 'Invoices retrieved successfully',
      data: invoices,
    };
  }

  @Get('status/:status')
  @ApiOperation({
    summary: 'Get invoices by status',
    description: 'Get all invoices with specific status',
  })
  @ApiParam({ name: 'status', description: 'Invoice status' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByStatus(@Param('status') status: string) {
    const invoices = await this.residentInvoicesService.getByStatus(status);
    return {
      statusCode: 200,
      message: 'Invoices retrieved successfully',
      data: invoices,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get invoice by ID',
    description: 'Get invoice information by ID',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const invoice = await this.residentInvoicesService.findById(id);
    return {
      statusCode: 200,
      message: 'Invoice retrieved successfully',
      data: invoice,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Update invoice',
    description: 'Update invoice information',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateResidentInvoiceDto: UpdateResidentInvoiceDto,
  ) {
    const invoice = await this.residentInvoicesService.update(id, updateResidentInvoiceDto);
    return {
      statusCode: 200,
      message: 'Invoice updated successfully',
      data: invoice,
    };
  }

  @Patch(':id/mark-paid')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Mark invoice as paid',
    description: 'Mark invoice as paid',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async markAsPaid(@Param('id', ParseUuidPipe) id: string) {
    const invoice = await this.residentInvoicesService.markAsPaid(id);
    return {
      statusCode: 200,
      message: 'Invoice marked as paid successfully',
      data: invoice,
    };
  }

  @Patch(':id/mark-overdue')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Mark invoice as overdue',
    description: 'Mark invoice as overdue',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async markAsOverdue(@Param('id', ParseUuidPipe) id: string) {
    const invoice = await this.residentInvoicesService.markAsOverdue(id);
    return {
      statusCode: 200,
      message: 'Invoice marked as overdue successfully',
      data: invoice,
    };
  }

  @Patch(':id/cancel')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Cancel invoice',
    description: 'Cancel an invoice',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async cancel(
    @Param('id', ParseUuidPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const invoice = await this.residentInvoicesService.cancelInvoice(id, reason);
    return {
      statusCode: 200,
      message: 'Invoice cancelled successfully',
      data: invoice,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete invoice',
    description: 'Soft delete invoice',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const invoice = await this.residentInvoicesService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Invoice deleted successfully',
      data: invoice,
    };
  }
}
