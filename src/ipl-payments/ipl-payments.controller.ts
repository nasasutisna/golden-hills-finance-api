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
  UseInterceptors,
  UploadedFile,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { IplPaymentsService } from './ipl-payments.service';
import { FileAttachmentsService } from '../file-attachments/file-attachments.service';
import { CreateIplPaymentDto } from './dto/create-ipl-payment.dto';
import { UpdateIplPaymentDto } from './dto/update-ipl-payment.dto';
import { ApproveIplPaymentDto } from './dto/approve-ipl-payment.dto';
import { RejectIplPaymentDto } from './dto/reject-ipl-payment.dto';
import { QueryIplPaymentsDto } from './dto/query-ipl-payments.dto';
import { CreateIplBulkPaymentDto } from './dto/create-ipl-bulk-payment.dto';
import { ApproveIplBulkPaymentDto } from './dto/approve-ipl-bulk-payment.dto';
import { RejectIplBulkPaymentDto } from './dto/reject-ipl-bulk-payment.dto';
import { QueryIplBulkPaymentsDto } from './dto/query-ipl-bulk-payments.dto';
import { PaymentMethod } from './dto/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('IPL Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ipl-payments')
export class IplPaymentsController {
  constructor(
    private readonly iplPaymentsService: IplPaymentsService,
    private readonly fileAttachmentsService: FileAttachmentsService,
  ) {}

  @Post()
  @Roles('COORDINATOR', 'ADMIN', 'ACCOUNTANT')
  @UseInterceptors(FileInterceptor('proofFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create new IPL payment (Coordinator, Admin, Accountant)',
    description: 'Submit IPL payment. For coordinators, payment requires approval. For admin/accountant, payment is auto-approved.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        periodId: { type: 'string', example: 'uuid-of-period', description: 'Period ID (bulan tahun pembayaran)' },
        residentId: { type: 'string', example: 'uuid-of-resident', description: 'Resident ID (warga yang membayar)' },
        paymentDate: { type: 'string', example: '2026-07-09', description: 'Payment date (tanggal pembayaran)' },
        paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER', 'CARD', 'E_WALLET'], description: 'Payment method' },
        referenceNumber: { type: 'string', example: 'REF123456789', description: 'Reference number (nomor referensi transfer)' },
        notes: { type: 'string', example: 'Pembayaran IPL bulan Juli', description: 'Additional notes' },
        proofFile: { type: 'string', format: 'binary', description: 'Proof of payment file' },
      },
      required: ['periodId', 'residentId', 'paymentDate', 'paymentMethod'],
    },
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(
    @UploadedFile() proofFile: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('periodId') periodId: string,
    @Body('residentId') residentId: string,
    @Body('paymentDate') paymentDate: string,
    @Body('paymentMethod') paymentMethod: string,
    @Body('referenceNumber') referenceNumber?: string,
    @Body('notes') notes?: string,
  ) {
    let fileAttachmentId: string | undefined;

    // If file was uploaded, create a file attachment record
    if (proofFile) {
      const fileAttachment = await this.fileAttachmentsService.create(
        {
          entityType: 'IplPayment',
          // entityId will be set by the service after payment creation
          fileName: proofFile.originalname,
          filePath: `/uploads/${proofFile.filename}`,
          fileSize: proofFile.size,
          mimeType: proofFile.mimetype,
          category: 'PAYMENT_PROOF',
          description: 'Bukti pembayaran IPL',
        },
        userId,
      );
      fileAttachmentId = fileAttachment.id;
    }

    // Build DTO from individual fields
    const createIplPaymentDto: CreateIplPaymentDto = {
      periodId,
      residentId,
      paymentDate,
      paymentMethod: paymentMethod as PaymentMethod,
      referenceNumber,
      notes,
      proofFileId: fileAttachmentId,
    };

    // Create payment with file attachment
    // Note: The service will handle linking the file attachment to the payment
    const payment = await this.iplPaymentsService.create(userId, createIplPaymentDto);

    const message = payment?.status === 'APPROVED'
      ? 'IPL payment created and auto-approved successfully'
      : 'IPL payment created successfully and awaiting approval';

    return {
      statusCode: 201,
      message,
      data: payment,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all IPL payments',
    description: 'Get paginated list of IPL payments with filtering options',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryIplPaymentsDto) {
    const result = await this.iplPaymentsService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'IPL payments retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('my-block')
  @Roles('COORDINATOR')
  @ApiOperation({
    summary: 'Get payments for coordinator\'s block (Coordinator only)',
    description: 'Get all IPL payments for the block where the user is assigned as coordinator',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getMyBlockPayments(
    @CurrentUser('id') userId: string,
    @Query() queryOptions: QueryIplPaymentsDto,
  ) {
    const result = await this.iplPaymentsService.getMyBlockPayments(userId, queryOptions);
    return {
      statusCode: 200,
      message: 'Block IPL payments retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('pending')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Get pending payments (Admin/Accountant only)',
    description: 'Get all pending IPL payments that need approval',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getPendingPayments(@Query() queryOptions: QueryIplPaymentsDto) {
    const result = await this.iplPaymentsService.getPendingPayments(queryOptions);
    return {
      statusCode: 200,
      message: 'Pending IPL payments retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('statistics')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Get payment statistics (Admin/Accountant only)',
    description: 'Get aggregated statistics for IPL payments',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getStatistics(@Query('periodId') periodId?: string) {
    const stats = await this.iplPaymentsService.getPaymentStatistics(periodId);
    return {
      statusCode: 200,
      message: 'IPL payment statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get IPL payment by ID',
    description: 'Get a specific IPL payment with full details',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findById(@Param('id', ParseUuidPipe) id: string) {
    const payment = await this.iplPaymentsService.findById(id);
    return {
      statusCode: 200,
      message: 'IPL payment retrieved successfully',
      data: payment,
    };
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Approve IPL payment (Admin/Accountant only)',
    description: 'Approve a pending IPL payment',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async approve(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser('id') approverId: string,
    @Body() dto: ApproveIplPaymentDto,
  ) {
    const payment = await this.iplPaymentsService.approve(id, approverId, dto);
    return {
      statusCode: 200,
      message: 'IPL payment approved successfully',
      data: payment,
    };
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Reject IPL payment (Admin/Accountant only)',
    description: 'Reject a pending IPL payment with a reason',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async reject(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser('id') approverId: string,
    @Body() dto: RejectIplPaymentDto,
  ) {
    const payment = await this.iplPaymentsService.reject(id, approverId, dto);
    return {
      statusCode: 200,
      message: 'IPL payment rejected successfully',
      data: payment,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Update IPL payment (Admin/Accountant only)',
    description: 'Update an existing IPL payment',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateIplPaymentDto: UpdateIplPaymentDto,
  ) {
    const payment = await this.iplPaymentsService.update(id, updateIplPaymentDto);
    return {
      statusCode: 200,
      message: 'IPL payment updated successfully',
      data: payment,
    };
  }

  @Delete(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Delete IPL payment (Admin/Accountant only)',
    description: 'Soft delete an IPL payment',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const payment = await this.iplPaymentsService.softDelete(id);
    return {
      statusCode: 200,
      message: 'IPL payment deleted successfully',
      data: payment,
    };
  }

  // ============================================================
  // BULK PAYMENT ENDPOINTS
  // ============================================================

  @Post('bulk')
  @Roles('COORDINATOR', 'ADMIN', 'ACCOUNTANT')
  @UseInterceptors(FileInterceptor('proofFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create bulk IPL payment (Coordinator, Admin, Accountant)',
    description: 'Submit IPL payment for multiple months. For coordinators, payment requires approval. For admin/accountant, payment is auto-approved.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        startPeriodId: { type: 'string', example: 'uuid-of-start-period', description: 'Starting period ID' },
        residentId: { type: 'string', example: 'uuid-of-resident', description: 'Resident ID (warga yang membayar)' },
        monthCount: { type: 'number', example: 6, description: 'Number of months (2-24)' },
        paymentDate: { type: 'string', example: '2026-07-09', description: 'Payment date (tanggal pembayaran)' },
        paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER', 'CARD', 'E_WALLET'], description: 'Payment method' },
        referenceNumber: { type: 'string', example: 'REF123456789', description: 'Reference number (nomor referensi transfer)' },
        notes: { type: 'string', example: 'Pembayaran IPL 6 bulan', description: 'Additional notes' },
        proofFile: { type: 'string', format: 'binary', description: 'Proof of payment file' },
      },
      required: ['startPeriodId', 'residentId', 'monthCount', 'paymentDate', 'paymentMethod'],
    },
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async createBulk(
    @UploadedFile() proofFile: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('startPeriodId') startPeriodId: string,
    @Body('residentId') residentId: string,
    @Body('monthCount') monthCount: string,
    @Body('paymentDate') paymentDate: string,
    @Body('paymentMethod') paymentMethod: string,
    @Body('referenceNumber') referenceNumber?: string,
    @Body('notes') notes?: string,
  ) {
    let fileAttachmentId: string | undefined;

    // If file was uploaded, create a file attachment record
    if (proofFile) {
      const fileAttachment = await this.fileAttachmentsService.create(
        {
          entityType: 'IplBulkPayment',
          fileName: proofFile.originalname,
          filePath: `/uploads/${proofFile.filename}`,
          fileSize: proofFile.size,
          mimeType: proofFile.mimetype,
          category: 'PAYMENT_PROOF',
          description: 'Bukti pembayaran IPL bulk',
        },
        userId,
      );
      fileAttachmentId = fileAttachment.id;
    }

    // Build DTO from individual fields
    const createIplBulkPaymentDto: CreateIplBulkPaymentDto = {
      startPeriodId,
      residentId,
      monthCount: parseInt(String(monthCount)),
      paymentDate,
      paymentMethod: paymentMethod as PaymentMethod,
      referenceNumber,
      notes,
      proofFileId: fileAttachmentId,
    };

    // Create bulk payment with file attachment
    const bulkPayment = await this.iplPaymentsService.createBulkPayment(userId, createIplBulkPaymentDto);

    const message = bulkPayment?.status === 'APPROVED'
      ? 'Bulk IPL payment created and auto-approved successfully'
      : 'Bulk IPL payment created successfully and awaiting approval';

    return {
      statusCode: 201,
      message,
      data: bulkPayment,
    };
  }

  @Get('bulk')
  @ApiOperation({
    summary: 'Get all bulk IPL payments',
    description: 'Get paginated list of bulk IPL payments with filtering options',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getBulkPayments(@Query() queryOptions: QueryIplBulkPaymentsDto) {
    const result = await this.iplPaymentsService.getBulkPayments(queryOptions);
    return {
      statusCode: 200,
      message: 'Bulk IPL payments retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('bulk/:id')
  @ApiOperation({
    summary: 'Get bulk IPL payment by ID',
    description: 'Get a specific bulk IPL payment with full details and all associated payments',
  })
  @ApiParam({ name: 'id', description: 'Bulk Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getBulkPaymentById(@Param('id', ParseUuidPipe) id: string) {
    const bulkPayment = await this.iplPaymentsService.getBulkPaymentById(id);
    return {
      statusCode: 200,
      message: 'Bulk IPL payment retrieved successfully',
      data: bulkPayment,
    };
  }

  @Get('bulk/pending')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Get pending bulk payments (Admin/Accountant only)',
    description: 'Get all pending bulk IPL payments that need approval',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getPendingBulkPayments(@Query() queryOptions: QueryIplBulkPaymentsDto) {
    const result = await this.iplPaymentsService.getBulkPayments({
      ...queryOptions,
      status: 'PENDING',
    });
    return {
      statusCode: 200,
      message: 'Pending bulk IPL payments retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Patch('bulk/:id/approve')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Approve bulk IPL payment (Admin/Accountant only)',
    description: 'Approve a pending bulk IPL payment and all its associated payments',
  })
  @ApiParam({ name: 'id', description: 'Bulk Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async approveBulk(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser('id') approverId: string,
    @Body() dto: ApproveIplBulkPaymentDto,
  ) {
    const bulkPayment = await this.iplPaymentsService.approveBulkPayment(id, approverId, dto);
    return {
      statusCode: 200,
      message: 'Bulk IPL payment approved successfully',
      data: bulkPayment,
    };
  }

  @Patch('bulk/:id/reject')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Reject bulk IPL payment (Admin/Accountant only)',
    description: 'Reject a pending bulk IPL payment and all its associated payments',
  })
  @ApiParam({ name: 'id', description: 'Bulk Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async rejectBulk(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser('id') approverId: string,
    @Body() dto: RejectIplBulkPaymentDto,
  ) {
    const bulkPayment = await this.iplPaymentsService.rejectBulkPayment(id, approverId, dto);
    return {
      statusCode: 200,
      message: 'Bulk IPL payment rejected successfully',
      data: bulkPayment,
    };
  }

  @Delete('bulk/:id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Delete bulk IPL payment (Admin/Accountant only)',
    description: 'Soft delete a bulk IPL payment and all its associated payments',
  })
  @ApiParam({ name: 'id', description: 'Bulk Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async removeBulk(@Param('id', ParseUuidPipe) id: string) {
    const bulkPayment = await this.iplPaymentsService.softDeleteBulkPayment(id);
    return {
      statusCode: 200,
      message: 'Bulk IPL payment deleted successfully',
      data: bulkPayment,
    };
  }
}
