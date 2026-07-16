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
  BadRequestException,
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
import { ResidentPaymentsService } from './resident-payments.service';
import { ResidentPaymentReceiptsService } from './resident-payment-receipts.service';
import { FileAttachmentsService } from '../file-attachments/file-attachments.service';
import { CreateResidentPaymentDto } from './dto/create-resident-payment.dto';
import { PaymentMethod } from './dto/create-resident-payment.dto';
import { UpdateResidentPaymentDto } from './dto/update-resident-payment.dto';
import { CreateBulkResidentPaymentDto } from './dto/create-bulk-resident-payment.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

const PROOF_REQUIRED_METHODS: string[] = [
  PaymentMethod.TRANSFER,
  PaymentMethod.E_WALLET,
  PaymentMethod.CARD,
];

@ApiTags('Resident Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('resident-payments')
export class ResidentPaymentsController {
  constructor(
    private readonly residentPaymentsService: ResidentPaymentsService,
    private readonly fileAttachmentsService: FileAttachmentsService,
    private readonly residentPaymentReceiptsService: ResidentPaymentReceiptsService,
  ) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @UseInterceptors(FileInterceptor('proofFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create new payment',
    description:
      'Create a new resident payment. Bukti transfer wajib untuk metode TRANSFER/E_WALLET/CARD (opsional untuk CASH). invoiceId opsional.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        residentId: { type: 'string', example: 'uuid-of-resident' },
        invoiceId: { type: 'string', example: 'uuid-of-invoice', description: 'Opsional' },
        paymentDate: { type: 'string', example: '2026-07-16' },
        paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER', 'CARD', 'E_WALLET'] },
        paymentChannel: { type: 'string', example: 'BCA' },
        referenceNumber: { type: 'string', example: 'REF123456789' },
        amount: { type: 'number', example: 500000 },
        bankName: { type: 'string', example: 'BCA' },
        accountNumber: { type: 'string', example: '1234567890' },
        notes: { type: 'string' },
        proofFile: { type: 'string', format: 'binary', description: 'Bukti transfer (wajib untuk non-tunai)' },
      },
      required: ['residentId', 'paymentDate', 'paymentMethod', 'amount'],
    },
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(
    @UploadedFile() proofFile: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body() createResidentPaymentDto: CreateResidentPaymentDto,
  ) {
    // Conditional validation: proof file required for non-cash methods
    if (PROOF_REQUIRED_METHODS.includes(createResidentPaymentDto.paymentMethod) && !proofFile) {
      throw new BadRequestException(
        `Bukti transfer wajib diupload untuk metode pembayaran ${createResidentPaymentDto.paymentMethod}`,
      );
    }

    // Persist proof file as a temp FileAttachment (renamed/linked by the service)
    let proofFileId: string | undefined;
    if (proofFile) {
      const fileAttachment = await this.fileAttachmentsService.create(
        {
          entityType: 'ResidentPayment',
          fileName: proofFile.originalname,
          filePath: `/uploads/temp/${proofFile.filename}`,
          fileSize: proofFile.size,
          mimeType: proofFile.mimetype,
          category: 'PAYMENT_PROOF',
          description: 'Bukti pembayaran warga',
        },
        userId,
      );
      proofFileId = fileAttachment.id;
    }

    const payment = await this.residentPaymentsService.create(
      userId,
      createResidentPaymentDto,
      proofFileId,
    );
    return {
      statusCode: 201,
      message: 'Payment created successfully',
      data: payment,
    };
  }

  @Post('bulk')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create bulk payments',
    description: 'Create multiple resident payments in a single transaction',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async createBulk(@Body() createBulkDto: CreateBulkResidentPaymentDto) {
    const result = await this.residentPaymentsService.createBulk(createBulkDto);

    if (result.failureCount > 0) {
      return {
        statusCode: 207, // Multi-status
        message: `Bulk payment processed: ${result.successCount} successful, ${result.failureCount} failed`,
        data: result,
      };
    }

    return {
      statusCode: 201,
      message: 'All payments created successfully',
      data: result,
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

  @Get(':id/receipt')
  @ApiOperation({
    summary: 'Get resident payment receipt (PDF)',
    description:
      'Generate or retrieve the receipt for a verified resident payment. Returns file info with URL.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getReceipt(@Param('id', ParseUuidPipe) id: string) {
    const receipt = await this.residentPaymentReceiptsService.getReceiptInfo(id);
    return {
      statusCode: 200,
      message: 'Receipt retrieved successfully',
      data: { ...receipt, url: receipt.filePath },
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
