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
import { IplReceiptsService } from './ipl-receipts.service';
import { FileAttachmentsService } from '../file-attachments/file-attachments.service';
import { CreateIplPaymentDto } from './dto/create-ipl-payment.dto';
import { UpdateIplPaymentDto } from './dto/update-ipl-payment.dto';
import { ApproveIplPaymentDto } from './dto/approve-ipl-payment.dto';
import { RejectIplPaymentDto } from './dto/reject-ipl-payment.dto';
import { QueryIplPaymentsDto } from './dto/query-ipl-payments.dto';
import { QueryIplPaymentMatrixDto } from './dto/query-ipl-payment-matrix.dto';
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
    private readonly iplReceiptsService: IplReceiptsService,
  ) {}

  @Post()
  @Roles('COORDINATOR', 'ADMIN', 'ACCOUNTANT')
  @UseInterceptors(FileInterceptor('proofFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create new IPL payment (Coordinator, Admin, Accountant)',
    description: 'Submit IPL payment (single or multi-month) with optional iuran kegiatan warga. Reference number is auto-generated. For coordinators, payment requires approval. For admin/accountant, payment is auto-approved.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        periodId: { type: 'string', example: 'uuid-of-period', description: 'Period ID (starting period for multi-month payment)' },
        residentId: { type: 'string', example: 'uuid-of-resident', description: 'Resident ID (warga yang membayar)' },
        monthCount: { type: 'number', example: 6, description: 'Number of months to pay (1-24, default: 1)' },
        paymentDate: { type: 'string', example: '2026-07-09', description: 'Payment date (tanggal pembayaran)' },
        paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER', 'CARD', 'E_WALLET'], description: 'Payment method' },
        kegiatanAmount: { type: 'number', example: 200000, description: 'Iuran kegiatan warga (optional - dalam Rupiah)' },
        notes: { type: 'string', example: 'Pembayaran IPL + Kegiatan', description: 'Additional notes' },
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
    @Body('monthCount') monthCount?: string,
    @Body('kegiatanAmount') kegiatanAmount?: string,
    @Body('notes') notes?: string,
  ) {
    let fileAttachmentId: string | undefined;
    let tempFilePath: string | undefined;

    // If file was uploaded, create a file attachment record
    if (proofFile) {
      // Store temp file path for later renaming
      tempFilePath = proofFile.path || proofFile.filename;

      const fileAttachment = await this.fileAttachmentsService.create(
        {
          entityType: 'IplPayment',
          // entityId will be set by the service after payment creation
          fileName: proofFile.originalname,
          filePath: `/uploads/temp/${proofFile.filename}`,
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
      monthCount: monthCount ? parseInt(monthCount, 10) : undefined,
      paymentDate,
      paymentMethod: paymentMethod as PaymentMethod,
      kegiatanAmount: kegiatanAmount ? parseFloat(kegiatanAmount) : undefined,
      notes,
      proofFileId: fileAttachmentId,
    };

    // Create payment with file attachment
    // Note: The service will handle auto-generating reference number and linking the file attachment
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

  @Get('by-reference/:referenceNumber')
  @ApiOperation({
    summary: 'Get all payments by reference number',
    description: 'Get all IPL and kegiatan payments grouped by reference number (single transfer)',
  })
  @ApiParam({ name: 'referenceNumber', description: 'Reference number (e.g., REF-20250114-0001)' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByReferenceNumber(@Param('referenceNumber') referenceNumber: string) {
    const result = await this.iplPaymentsService.getByReferenceNumber(referenceNumber);
    return {
      statusCode: 200,
      message: 'Payments by reference number retrieved successfully',
      data: result,
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

  @Get('matrix')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Get IPL payment matrix (Admin/Accountant only)',
    description: 'Read-only matrix of house unit x monthly payment status for a year, with monthly and yearly totals.',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getMatrix(@Query() query: QueryIplPaymentMatrixDto) {
    const data = await this.iplPaymentsService.getMatrix(query);
    return {
      statusCode: 200,
      message: 'IPL payment matrix retrieved successfully',
      data,
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

  @Get(':id/receipt')
  @ApiOperation({
    summary: 'Get IPL payment receipt (PDF)',
    description: 'Generate or retrieve the receipt for an approved IPL payment. Returns file info with URL for viewing/downloading.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getReceipt(@Param('id', ParseUuidPipe) id: string) {
    const receipt = await this.iplReceiptsService.getReceiptInfo(id);

    return {
      statusCode: 200,
      message: 'Receipt retrieved successfully',
      data: {
        ...receipt,
        url: `${receipt.filePath}`, // URL for accessing the file
      },
    };
  }
}
